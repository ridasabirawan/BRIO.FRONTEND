"use client";
import React from "react";
import { Worker, Viewer, RotateDirection, SpecialZoomLevel } from "@react-pdf-viewer/core";
import type { ToolbarSlot } from "@react-pdf-viewer/toolbar";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

// Import react-pdf-viewer default styles to resolve rendering alignment issues
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";

interface PDFViewerProps {
  pdfUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  const toolbarPluginInstance = toolbarPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { Toolbar } = toolbarPluginInstance;

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
      <div className="w-full h-full min-h-0 flex flex-col overflow-hidden rounded-2xl bg-[#111113]">
        {/* Style Overrides for React PDF Viewer components inside dark theme */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Clean up core buttons to look rounded and premium */
          .rpv-core__button {
            background-color: transparent !important;
            color: #d4d4d8 !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 6px !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .rpv-core__button:hover {
            background-color: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
          }
          .rpv-core__button:disabled {
            opacity: 0.25 !important;
            cursor: not-allowed !important;
          }
          .rpv-core__button svg {
            fill: currentColor !important;
            color: inherit !important;
            width: 16px !important;
            height: 16px !important;
          }
          
          /* Style the page number textbox */
          .rpv-core__textbox {
            background-color: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #ffffff !important;
            border-radius: 6px !important;
            padding: 2px 6px !important;
            text-align: center !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            width: 36px !important;
            height: 24px !important;
            transition: all 0.2s ease !important;
          }
          .rpv-core__textbox:focus {
            outline: none !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
            background-color: rgba(255, 255, 255, 0.12) !important;
          }

          /* Style the Zoom Dropdown Menu Popover */
          .rpv-core__popover-body {
            background-color: #1e1e1e !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
            color: #ffffff !important;
            padding: 4px !important;
            z-index: 50 !important;
          }
          .rpv-core__menu-item {
            background-color: transparent !important;
            color: #d4d4d8 !important;
            border-radius: 6px !important;
            padding: 6px 12px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
          }
          .rpv-core__menu-item:hover {
            background-color: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
          }

          /* Center pages container, remove margins, and paint canvas */
          .rpv-core__inner-pages {
            background-color: #0f0f11 !important;
            padding-top: 16px !important;
            padding-bottom: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: rgba(255, 255, 255, 0.12) transparent !important;
          }
          .rpv-core__page-layer {
            background-color: #ffffff !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
            margin-bottom: 24px !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
          }
        `}} />

        {/* ChatGPT / Claude Style Dark Toolbar */}
        <div className="shrink-0 h-12 flex items-center border-b border-white/10 bg-[#1e1e1e] px-4 text-white z-10 select-none">
          <Toolbar>
            {(slots: ToolbarSlot) => {
              const {
                CurrentPageInput,
                GoToNextPage,
                GoToPreviousPage,
                NumberOfPages,
                Zoom,
                ZoomIn,
                ZoomOut,
                Rotate,
              } = slots;

              return (
                <div className="flex items-center justify-between w-full">
                  {/* Page Navigation Area */}
                  <div className="flex items-center gap-1.5">
                    <GoToPreviousPage />
                    <div className="flex items-center gap-1.5 text-zinc-300 text-xs px-1">
                      <CurrentPageInput />
                      <span className="text-white/30 font-light">/</span>
                      <span className="text-white/80 font-medium min-w-4 text-center">
                        <NumberOfPages />
                      </span>
                    </div>
                    <GoToNextPage />
                  </div>

                  {/* Zoom Controls Area */}
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
                    <ZoomOut />
                    <div className="text-zinc-300 font-medium text-xs min-w-16 flex justify-center">
                      <Zoom />
                    </div>
                    <ZoomIn />
                  </div>

                  {/* Rotate Page Action */}
                  <div className="flex items-center">
                    <Rotate direction={RotateDirection.Forward} />
                  </div>
                </div>
              );
            }}
          </Toolbar>
        </div>

        {/* Scrollable Container with centered PDF sheet */}
        <div className="flex-1 min-h-0 relative bg-[#0f0f11]">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[toolbarPluginInstance, pageNavigationPluginInstance]}
            defaultScale={SpecialZoomLevel.PageWidth}
          />
        </div>
      </div>
    </Worker>
  );
};

export default PDFViewer;