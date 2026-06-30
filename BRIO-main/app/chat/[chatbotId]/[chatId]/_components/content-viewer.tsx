"use client";

import dynamic from "next/dynamic";
import UrlViewer from "./url-viewer";

const PDFViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      Loading PDF viewer...
    </div>
  ),
});

interface ContentViewerProps {
  source: {
    type: string;
    sourceUrl: string;
  };
}

export default function ContentViewer({ source }: ContentViewerProps) {
  const officeFormats = [
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "odt",
    "ods",
    "odp",
  ];

  if (!source?.sourceUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        No content available
      </div>
    );
  }

  const fileExtension = source.type?.toLowerCase();

  const container =
    "w-full h-full flex flex-col overflow-hidden bg-[#111113]";

  switch (source.type) {
    case "pdf":
      return (
        <div className={container}>
          <PDFViewer pdfUrl={source.sourceUrl} />
        </div>
      );

    case "text":
    case "txt":
      return (
        <div className="w-full h-full p-6 overflow-y-auto bg-white">
          <pre className="whitespace-pre-wrap font-sans">
            {source.sourceUrl}
          </pre>
        </div>
      );

    case "markdown":
      return (
        <div className="w-full h-full p-6 overflow-y-auto bg-white prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans">
            {source.sourceUrl}
          </pre>
        </div>
      );

    case "url":
    case "sitemap":
      return (
        <div className="w-full h-full overflow-hidden">
          <UrlViewer url={source.sourceUrl} />
        </div>
      );

    case "csv":
    case "docx":
      return (
        <div className="w-full h-full overflow-hidden bg-white">
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              source.sourceUrl
            )}&embedded=true`}
            className="w-full h-full border-0"
          />
        </div>
      );

    case "img":
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden">
          <img
            src={source.sourceUrl}
            alt="Uploaded content"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );

    default:
      if (officeFormats.includes(fileExtension)) {
        return (
          <div className="w-full h-full overflow-hidden bg-white">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                source.sourceUrl
              )}`}
              className="w-full h-full border-0"
            />
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Unsupported file type: {source.type}
            </p>
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Download File
            </a>
          </div>
        </div>
      );
  }
}