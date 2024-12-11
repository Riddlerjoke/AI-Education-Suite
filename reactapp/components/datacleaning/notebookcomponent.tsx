import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import { NotebookCell, Notebook, CellOutput } from '@/types';
import {inline} from "@floating-ui/dom";

interface NotebookComponentProps {
  notebookUrl?: string;
}

const NotebookComponent: React.FC<NotebookComponentProps> = ({ notebookUrl }) => {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [cells, setCells] = useState<NotebookCell[]>([]);

  useEffect(() => {
    if (!notebookUrl) return;

    const loadNotebook = async () => {
      try {
        const response = await fetch(notebookUrl);
        const data: Notebook = await response.json();
        setNotebook(data);
        setCells(data.cells || []);
      } catch (error) {
        console.error('Erreur lors du chargement du notebook:', error);
      }
    };

    loadNotebook();
  }, [notebookUrl]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: Notebook = JSON.parse(content);
        setNotebook(data);
        setCells(data.cells || []);
      } catch (error) {
        console.error('Erreur lors de l’analyse du fichier notebook:', error);
      }
    };
    reader.readAsText(file);
  };

  const renderOutput = (outputs: CellOutput[]) => (
    <div className="output my-2 overflow-container">
      {outputs.map((output, index) => {
        if (output.data && output.data['image/png']) {
          const base64Image = `data:image/png;base64,${output.data['image/png']}`;
          return <img key={index} src={base64Image} alt="Output Image" className="my-2 max-w-full h-auto" />;
        }
        if (output.text) {
          return (
            <pre key={index} className="output-text bg-gray-100 p-2 rounded overflow-container">
              {output.text}
            </pre>
          );
        }
        return null;
      })}
    </div>
  );

  // @ts-ignore
  return (
    <div className="notebook-component p-6 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-semibold mb-4">Notebook visualisation</h1>
      <h2 className="text-lg font-semibold mb-4">Charger un fichier notebook .ipynd </h2>
      <p className="text-gray-500 mb-4">cette outil va vous permettre de visualiser vos notebook </p>
      <input type="file" accept=".ipynb" onChange={handleFileUpload} className="mb-4 p-2 border rounded" />

      {cells.length > 0 ? (
        cells.map((cell, index) => (
          <div key={index} className="cell my-4 p-4 border rounded-md bg-gray-100">
            {cell.cell_type === 'markdown' && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({className, children }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter style={vscDarkPlus} language={match[1]} className="overflow-container">
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} overflow-container`}>{children}</code>
                    );
                  },
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt} className="my-4 max-w-full h-auto" />
                  ),
                }}
              >
                {DOMPurify.sanitize(cell.source.join(''))}
              </ReactMarkdown>
            )}
            {cell.cell_type === 'code' && (
              <div className="overflow-container">
                <SyntaxHighlighter language="python" style={vscDarkPlus} className="rounded overflow-container">
                  {cell.source.join('')}
                </SyntaxHighlighter>
                {cell.outputs && renderOutput(cell.outputs)}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">Aucun contenu disponible dans ce notebook.</p>
      )}
    </div>
  );
};

export default NotebookComponent;
