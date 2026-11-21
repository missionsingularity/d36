# Historical regression support

These original government-domain service modules and synthetic fixtures are retained solely so the original unit tests can continue running. They are not imported by the active enterprise application and have no live API routes. The original UI, routes and complete history are recoverable from `checkpoint/pre-enterprise-rebuild-20261122` and `recovery-before-rebuild.bundle`.

Run `npm.cmd run test:legacy` for original service regressions. `tests/browser/` retains the historical browser specifications of the retired UI for reference; it is not the current acceptance suite. Use `npm.cmd run test:e2e` for the new enterprise interface.
