'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Renders markdown content with styled UI using react-markdown + remark-gfm.
 * Supports: headings, code blocks, links, lists, tables, blockquotes, images.
 * Uses the .markdown-preview CSS class from globals.css.
 */
export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    if (!content) return null;

    return (
        <div className={`markdown-preview ${className || ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Code blocks with copy button
                    code({ className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClassName || '');
                        const isBlock = match || (typeof children === 'string' && children.includes('\n'));

                        if (isBlock) {
                            return (
                                <CodeBlock language={match?.[1] || ''}>
                                    {String(children).replace(/\n$/, '')}
                                </CodeBlock>
                            );
                        }

                        return (
                            <code className={codeClassName} {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Links open in new tab for external URLs
                    a({ href, children, ...props }) {
                        const isExternal = href?.startsWith('http');
                        return (
                            <a
                                href={href}
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    },
                    // Checkboxes in lists
                    input({ type, checked, ...props }) {
                        if (type === 'checkbox') {
                            return (
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    readOnly
                                    style={{
                                        marginRight: 6,
                                        accentColor: 'var(--accent-brand)',
                                        cursor: 'default',
                                    }}
                                    {...props}
                                />
                            );
                        }
                        return <input type={type} {...props} />;
                    },
                }}
            />
        </div>
    );
}

/**
 * Code block with syntax label and copy button.
 */
function CodeBlock({ language, children }: { language: string; children: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ position: 'relative', marginBottom: '1em' }}>
            {/* Language label + copy button */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '8px 8px 0 0',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-tertiary)',
            }}>
                <span>{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: copied ? 'var(--status-success)' : 'var(--text-tertiary)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontFamily: 'var(--font-family)',
                        fontWeight: 500,
                        padding: '2px 6px',
                        borderRadius: 4,
                        transition: 'all var(--transition-fast)',
                    }}
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
            <pre style={{
                borderRadius: '0 0 8px 8px',
                marginTop: 0,
            }}>
                <code className={language ? `language-${language}` : ''}>
                    {children}
                </code>
            </pre>
        </div>
    );
}
