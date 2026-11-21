import type { Metadata } from 'next';
import './enterprise.css';
import {ThemeProvider} from './theme-provider';
export const metadata: Metadata = { title: 'BrahmaGPT · Singularity', description: 'Your knowledge, people and work. Connected in one workspace.' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('brahma-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}"}}/></head><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
