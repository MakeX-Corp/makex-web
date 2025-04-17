import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { atomDark, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface CodeRendererProps {
  content: string;
  language?: string;
}

export default function CodeRenderer({ content, language = 'javascript' }: CodeRendererProps) {
  const { theme } = useTheme();
  const style = theme === 'dark' ? atomDark : vs;

  return (
    <div className="rounded-md overflow-hidden w-full max-w-full">
      {/* @ts-ignore */}
      <SyntaxHighlighter
        language={language}
        style={style}
        customStyle={{
          margin: 0,
          padding: '1rem',
          backgroundColor: theme === 'dark' ? 'hsl(var(--muted))' : '#ffffff',
          borderRadius: '0.375rem',
          fontSize: '0.9rem',
          border: theme === 'dark' ? 'none' : '1px solid #e1e4e8',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          wordBreak: 'normal',
          whiteSpace: 'pre'
        }}
        showLineNumbers
        wrapLines={false}
        wrapLongLines={false}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
} 