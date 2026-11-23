import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  db,
  uid,
  log,
  insertRecord,
  timestamp,
  atomic,
  dataDirectory,
} from "@/lib/enterprise/db";
import {
  identity,
  requireWorkspaceWriteAccess,
} from "@/lib/enterprise/auth";
import {
  employee,
  snapshot,
  search,
  draft,
  revise,
  submit,
  decide,
  execute,
  requestLeave,
  createProject,
  updateTask,
  updateITRecord,
  createITIncident,
  document,
  getRecord,
  WorkspaceError,
} from "@/lib/enterprise/service";
import { runChat } from "@/lib/enterprise/planner";
import type { Workflow } from "@/lib/enterprise/types";
import { importCsv } from "@/lib/enterprise/import";
import { testGeminiConnection } from "@/lib/enterprise/planner";
import {
  control as controlWork,
  runDetail,
  tick as tickWork,
} from "@/lib/enterprise/work-engine";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function renderDocument(
  title: string,
  content: string,
  version: number,
  format: string,
) {
  if (format === "docx") {
    const { Document, Packer, Paragraph, HeadingLevel } = await import("docx");
    const file = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
            new Paragraph(`Version ${version}`),
            ...content.split("\n").map((line) => new Paragraph(line)),
          ],
        },
      ],
    });
    return {
      bytes: Buffer.from(await Packer.toBuffer(file)),
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  if (format === "pdf") {
    const { PDFDocument, StandardFonts } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let page = pdf.addPage();
    let y = 790;
    for (const line of `${title}\n\nVersion ${version}\n\n${content}`.split(
      "\n",
    )) {
      const words = line.replace(/[^\x20-\x7E]/g, " ").split(" ");
      let out = "";
      for (const word of words) {
        if (font.widthOfTextAtSize(out + word, 11) > 490 && out) {
          if (y < 45) {
            page = pdf.addPage();
            y = 790;
          }
          page.drawText(out, { x: 50, y, size: 11, font });
          y -= 17;
          out = "";
        }
        out += word + " ";
      }
      if (y < 45) {
        page = pdf.addPage();
        y = 790;
      }
      page.drawText(out, { x: 50, y, size: 11, font });
      y -= 17;
    }
    return { bytes: Buffer.from(await pdf.save()), mime: "application/pdf" };
  }
  if (format === "xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Document");
    sheet.columns = [
      { header: "Section", key: "section", width: 28 },
      { header: "Content", key: "content", width: 100 },
    ];
    sheet.addRow({ section: title, content: `Version ${version}` });
    content
      .split("\n")
      .forEach((line, i) =>
        sheet.addRow({ section: `Line ${i + 1}`, content: line }),
      );
    sheet.getRow(1).font = { bold: true };
    sheet.eachRow((row) => {
      row.alignment = { wrapText: true, vertical: "top" };
    });
    return {
      bytes: Buffer.from(await book.xlsx.writeBuffer()),
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }
  if (format === "pptx") {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const deck = new PptxGenJS();
    deck.layout = "LAYOUT_WIDE";
    const lines = content.split("\n").filter(Boolean);
    const groups: string[][] = [];
    for (let i = 0; i < Math.max(lines.length, 1); i += 7)
      groups.push(lines.slice(i, i + 7));
    groups.forEach((group, i) => {
      const slide = deck.addSlide();
      slide.addText(title, {
        x: 0.6,
        y: 0.35,
        w: 11.8,
        h: 0.55,
        fontSize: 24,
        bold: true,
        color: "312E81",
      });
      slide.addText(`Version ${version}${i ? ` · ${i + 1}` : ""}`, {
        x: 0.6,
        y: 1,
        w: 11.8,
        h: 0.35,
        fontSize: 12,
        color: "64748B",
      });
      slide.addText(group.join("\n") || "No content", {
        x: 0.8,
        y: 1.6,
        w: 11.4,
        h: 4.8,
        fontSize: 18,
        fit: "shrink",
        color: "172033",
      });
    });
    return {
      bytes: Buffer.from(
        (await deck.write({ outputType: "nodebuffer" })) as Buffer,
      ),
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  }
  throw new WorkspaceError("Unsupported document format", 400);
}
function failure(e: unknown) {
  return NextResponse.json(
    {
      error:
        e instanceof z.ZodError
          ? e.issues.map((i) => i.message).join("; ")
          : e instanceof Error
            ? e.message
            : "Request failed",
    },
    {
      status:
        e instanceof WorkspaceError
          ? e.status
          : e instanceof z.ZodError
            ? 400
            : 500,
    },
  );
}
async function retryApprovalSubmission(
  u: ReturnType<typeof employee>,
  id: string,
) {
  const genericMessage =
    "Your report draft was saved, but the approval request could not be created. You can retry the approval submission.";
  const workflow = db()
    .prepare("SELECT owner,status,documentId,events FROM workflows WHERE id=?")
    .get(id) as
    | {
        owner: string;
        status: string;
        documentId: string | null;
        events: string;
      }
    | undefined;
  if (!workflow || workflow.owner !== u.id || !workflow.documentId)
    throw new WorkspaceError("Workflow unavailable", 404);
  const savedDocument = document(u, workflow.documentId);
  const latest = savedDocument.versions.at(-1)!;
  const existing = db()
    .prepare("SELECT id,status,reviewerId FROM approvals WHERE versionId=?")
    .get(latest.id) as
    { id: string; status: string; reviewerId: string | null } | undefined;
  if (existing) {
    if (existing.status !== "PENDING_APPROVAL")
      throw new WorkspaceError(
        "This draft version already has a decision",
        409,
      );
    const reviewer = existing.reviewerId
      ? employee(existing.reviewerId).name
      : "the assigned reviewer";
    return {
      approvalId: existing.id,
      status: existing.status,
      reviewer,
      documentId: workflow.documentId,
    };
  }
  if (workflow.status !== "Failed")
    throw new WorkspaceError(
      "This workflow is not waiting to retry approval",
      409,
    );
  try {
    const run = runDetail(u, id);
    const submitStep = run.steps.find(
      (step) =>
        step.spec.tool === "submit_approval" && step.status === "QUEUED",
    );
    const draftStep = run.steps.find(
      (step) =>
        step.spec.tool === "create_document_draft" &&
        (step.output as { id?: string } | null)?.id === workflow.documentId,
    );
    if (!submitStep || !draftStep || run.status !== "FAILED")
      throw new WorkspaceError(
        "Only the failed approval step can be retried",
        409,
      );
    if (savedDocument.owner !== u.id || savedDocument.status !== "DRAFT")
      throw new WorkspaceError(
        "The saved draft is no longer available to submit",
        409,
      );

    // Link this existing report to the project already calculated by the completed run.
    if (!savedDocument.target) {
      const progress = run.steps.find(
        (step) =>
          step.spec.tool === "calculate_project_progress" && step.output,
      )?.output as { project?: { id?: string; type?: string } } | undefined;
      const projectId = progress?.project?.id;
      if (projectId && progress?.project?.type === "Projects") {
        db()
          .prepare(
            "UPDATE documents SET target=? WHERE id=? AND status='DRAFT'",
          )
          .run(projectId, workflow.documentId);
        db()
          .prepare("UPDATE records SET project=?,updated=? WHERE id=?")
          .run(projectId, timestamp(), `doc-${workflow.documentId}`);
        db()
          .prepare(
            "INSERT OR IGNORE INTO relationships(id,fromId,relation,toId) VALUES(?,?,?,?)",
          )
          .run(uid(), workflow.documentId, "REFERENCES", projectId);
      }
    }
    controlWork(u, id, "retry");
    await tickWork(id);
    const resumed = runDetail(u, id);
    const approvalStep = resumed.steps.find(
      (step) => step.spec.tool === "submit_approval",
    );
    const approvalId = approvalStep?.output;
    const approval =
      typeof approvalId === "string"
        ? (db()
            .prepare(
              "SELECT id,status,documentId,versionId,reviewerId FROM approvals WHERE id=?",
            )
            .get(approvalId) as
            | {
                id: string;
                status: string;
                documentId: string;
                versionId: string;
                reviewerId: string | null;
              }
            | undefined)
        : undefined;
    if (
      !approval ||
      approval.status !== "PENDING_APPROVAL" ||
      approval.documentId !== workflow.documentId ||
      approval.versionId !== latest.id
    )
      throw new Error(
        resumed.error || "Approval request did not pass verification",
      );
    const reviewer = approval.reviewerId
      ? employee(approval.reviewerId).name
      : "the assigned reviewer";
    const text = `Approval ${approval.id} is pending with ${reviewer}. Your saved draft remains in Documents for review.`;
    const events = JSON.parse(workflow.events) as Workflow["events"];
    events.push({
      tool: "submit_approval",
      status: "completed",
      detail: `Approval ${approval.id} created for ${latest.id}; assigned to ${reviewer}.`,
      at: timestamp(),
    });
    atomic(() => {
      db()
        .prepare(
          "UPDATE workflows SET status='Pending approval',events=? WHERE id=? AND owner=?",
        )
        .run(JSON.stringify(events), id, u.id);
      db()
        .prepare(
          "UPDATE messages SET text=? WHERE runId=? AND role='assistant'",
        )
        .run(text, id);
    });
    return {
      approvalId: approval.id,
      status: approval.status,
      reviewer,
      documentId: workflow.documentId,
    };
  } catch (error) {
    console.error("[BrahmaGPT] Approval retry failed", id, error);
    if (error instanceof WorkspaceError && [403, 404].includes(error.status))
      throw error;
    throw new WorkspaceError(genericMessage, 409);
  }
}
export async function GET(req: NextRequest) {
  try {
    const u = await identity(req);
    if (!u) throw new WorkspaceError("Sign in required.", 401);
    const url = req.nextUrl;
    let response: NextResponse;
    if (url.searchParams.has("source")) {
      const sourceRecord = getRecord(u, url.searchParams.get("source")!);
      if (sourceRecord.type !== "Documents")
        throw new WorkspaceError("Source file unavailable", 404);
      const rendition = url.searchParams.get("rendition") || "docx";
      const artifacts = sourceRecord.data.artifacts as
        Record<string, string> | undefined;
      const relativePath =
        rendition === "pdf"
          ? artifacts?.pdf || sourceRecord.data.pdfFile
          : rendition === "docx"
            ? artifacts?.docx || sourceRecord.data.sourceFile
            : rendition === "xlsx" || rendition === "pptx"
              ? artifacts?.[rendition]
              : undefined;
      const expectedHash =
        rendition === "pdf"
          ? artifacts?.pdfHash || sourceRecord.data.pdfHash
          : rendition === "docx"
            ? artifacts?.docxHash || sourceRecord.data.sourceHash
            : artifacts?.[`${rendition}Hash`];
      if (
        typeof relativePath !== "string" ||
        !relativePath ||
        typeof expectedHash !== "string"
      )
        throw new WorkspaceError("That source file is not available", 404);
      const root = path.resolve(process.cwd());
      const generatedRoot = path.join(dataDirectory(), "generated");
      const isGenerated = relativePath.startsWith("@generated/");
      const allowedRoot = isGenerated ? generatedRoot : root;
      const absolutePath = isGenerated
        ? path.resolve(generatedRoot, relativePath.slice("@generated/".length))
        : path.resolve(root, relativePath);
      const relativeToRoot = path.relative(allowedRoot, absolutePath);
      if (
        path.isAbsolute(relativeToRoot) ||
        relativeToRoot === ".." ||
        relativeToRoot.startsWith(".." + path.sep)
      )
        throw new WorkspaceError("Source path is outside the workspace", 403);
      let sourceBytes: Buffer;
      try {
        sourceBytes = await readFile(absolutePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
          throw new WorkspaceError("Source file is no longer available", 404);
        throw error;
      }
      const actualHash = createHash("sha256").update(sourceBytes).digest("hex");
      if (actualHash !== expectedHash)
        throw new WorkspaceError(
          "Source file changed after indexing. Re-index it before citing.",
          409,
        );
      const fileName = path.basename(absolutePath);
      const isPdf = rendition === "pdf";
      response = new NextResponse(new Uint8Array(sourceBytes), {
        headers: {
          "Content-Type": isPdf
            ? "application/pdf"
            : rendition === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : rendition === "pptx"
                ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `${isPdf ? "inline" : "attachment"}; filename="${fileName}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } else if (url.searchParams.has("q"))
      response = NextResponse.json({
        results: search(
          u,
          url.searchParams.get("q")!.slice(0, 1000),
          url.searchParams.get("type") || "All",
          url.searchParams.get("save") === "1",
        ),
      });
    else if (url.searchParams.get("document")) {
      const d = document(u, url.searchParams.get("document")!);
      if (
        url.searchParams.has("version") &&
        !d.versions.some((v) => v.id === url.searchParams.get("version"))
      )
        throw new WorkspaceError("Document version unavailable", 404);
      const version =
        d.versions.find((v) => v.id === url.searchParams.get("version")) ||
        d.versions.at(-1)!;
      const format = url.searchParams.get("format");
      if (format && ["docx", "pdf", "xlsx", "pptx"].includes(format)) {
        const rendered = await renderDocument(
          version.title,
          version.content,
          version.number,
          format,
        );
        const artifactDir = path.join(dataDirectory(), "generated", d.id);
        await mkdir(artifactDir, { recursive: true });
        const artifactPath = path.join(artifactDir, `${version.id}.${format}`);
        await writeFile(artifactPath, rendered.bytes);
        const recordId = `doc-${d.id}`;
        let sourceRecord;
        try {
          sourceRecord = getRecord(u, recordId);
        } catch (error) {
          if (!(error instanceof WorkspaceError) || error.status !== 404)
            throw error;
          insertRecord({
            id: recordId,
            type: "Documents",
            title: version.title,
            body: version.content,
            department: d.department,
            owner: d.owner,
            status: d.status,
            updated: timestamp(),
            data: { documentId: d.id, version: version.number },
          });
          sourceRecord = getRecord(u, recordId);
        }
        const artifacts =
          (sourceRecord.data.artifacts as Record<string, string> | undefined) ||
          {};
        artifacts[format] = `@generated/${d.id}/${version.id}.${format}`;
        artifacts[`${format}Hash`] = createHash("sha256")
          .update(rendered.bytes)
          .digest("hex");
        db()
          .prepare("UPDATE records SET data=?,updated=? WHERE id=?")
          .run(
            JSON.stringify({ ...sourceRecord.data, artifacts }),
            timestamp(),
            `doc-${d.id}`,
          );
        const safeTitle =
          version.title.replace(/[^\p{L}\p{N}-]+/gu, "-").slice(0, 70) ||
          "document";
        response = new NextResponse(new Uint8Array(rendered.bytes), {
          headers: {
            "Content-Type": rendered.mime,
            "Content-Disposition": `attachment; filename="${safeTitle}-v${version.number}.${format}"`,
            "Cache-Control": "private, no-store",
          },
        });
      } else response = NextResponse.json(d);
    } else response = NextResponse.json(snapshot(u));
    return response;
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (
      !origin ||
      new URL(origin).host !== req.headers.get("host") ||
      !["http:", "https:"].includes(new URL(origin).protocol)
    )
      throw new WorkspaceError("Same-origin request required", 403);
    if (Number(req.headers.get("content-length") || 0) > 1500000)
      throw new WorkspaceError("Request too large", 413);
    const u = await identity(req);
    if (!u)
      throw new WorkspaceError(
        "Reload the workspace to establish a local session",
        401,
      );
    requireWorkspaceWriteAccess(u);
    const body = await req.json();
    if (!body || typeof body.action !== "string")
      throw new WorkspaceError("Action required");
    let result: unknown;
    switch (body.action) {
      case "testGemini":
        if (u.role !== "admin")
          throw new WorkspaceError("Administrator required", 403);
        result = await testGeminiConnection();
        break;
      case "switchUser":
        throw new WorkspaceError("Use the authorized Switch Demo Role account option.", 403);
      case "chat":
        result = await runChat(u, body);
        break;
      case "retryApproval":
        result = await retryApprovalSubmission(
          u,
          z.string().min(1).max(100).parse(body.id),
        );
        break;
      case "draft":
        result = draft(u, body);
        break;
      case "revise":
        result = revise(u, body);
        break;
      case "submit":
        result = submit(u, z.string().parse(body.id));
        break;
      case "decide":
        result = decide(u, body);
        break;
      case "execute":
        result = execute(u, z.string().parse(body.id));
        break;
      case "leave":
        result = requestLeave(u, body);
        break;
      case "project":
        result = createProject(u, body);
        break;
      case "task":
        result = updateTask(u, body);
        break;
      case "itIncident":
        result = updateITRecord(u, body);
        break;
      case "createITIncident":
        result = createITIncident(u, body);
        break;
      case "import":
        result = importCsv(u, body);
        break;
      case "readNotifications":
        db()
          .prepare("UPDATE notifications SET read=1 WHERE userId=?")
          .run(u.id);
        result = { saved: true };
        break;
      case "readNotification": {
        const id = z.string().min(1).max(100).parse(body.id);
        const updated = db()
          .prepare("UPDATE notifications SET read=1 WHERE id=? AND userId=?")
          .run(id, u.id);
        if (!updated.changes)
          throw new WorkspaceError("Notification not found", 404);
        result = { saved: true, id };
        break;
      }
      case "settings": {
        if (u.role !== "admin")
          throw new WorkspaceError("Administrator required", 403);
        const value = z
          .object({
            workspace: z.string().min(1).max(100),
            departments: z.array(z.string().min(1).max(100)).max(30),
            roles: z.array(
              z.enum(["employee", "it_manager", "hr_manager", "admin"]),
            ),
            approvalRules: z.object({
              replacement: z.enum(["it_manager", "admin"]),
              leave: z.enum(["hr_manager", "admin"]),
              note: z.literal("admin"),
              task: z.enum(["admin", "it_manager"]).optional(),
            }),
            templates: z
              .array(
                z.object({
                  name: z.string().min(1).max(100),
                  content: z.string().max(50000),
                }),
              )
              .max(30),
            workflowTemplates: z.array(z.string().max(100)).max(30),
            customFields: z.array(z.string().max(100)).max(30),
            modules: z.array(z.enum(["IT", "HR", "Projects"])),
          })
          .strict()
          .parse(body.value);
        db()
          .prepare("UPDATE settings SET payload=? WHERE id=1")
          .run(JSON.stringify(value));
        log(
          u.id,
          "Workspace customized",
          "Settings, templates and approval configuration saved",
        );
        result = { saved: true };
        break;
      }
      default:
        throw new WorkspaceError("Unknown action");
    }
    return NextResponse.json({ result });
  } catch (e) {
    return failure(e);
  }
}
