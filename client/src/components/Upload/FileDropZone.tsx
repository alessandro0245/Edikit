"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface FileDropZoneHandle {
  open: () => void;
}

interface FileDropZoneProps {
  inputId: string;
  accept: string;
  onFileSelect?: (file: File | null, inputElement?: HTMLInputElement) => void;
  onFilesSelect?: (files: File[], inputElement?: HTMLInputElement) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

const FileDropZone = forwardRef<FileDropZoneHandle, FileDropZoneProps>(
  function FileDropZone(
    {
      inputId,
      accept,
      onFileSelect,
      onFilesSelect,
      multiple = false,
      disabled = false,
      className = "",
      children,
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragDepthRef = useRef(0);

    const openFilePicker = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    useImperativeHandle(ref, () => ({
      open: openFilePicker,
    }));

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      dragDepthRef.current += 1;
      setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current -= 1;
      if (dragDepthRef.current <= 0) {
        dragDepthRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const processFiles = (
      files: FileList | null,
      inputElement?: HTMLInputElement,
    ) => {
      if (!files || files.length === 0) return;

      if (multiple && onFilesSelect) {
        onFilesSelect(Array.from(files), inputElement);
      } else if (onFileSelect) {
        onFileSelect(files[0], inputElement);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragging(false);
      if (disabled) return;
      processFiles(event.dataTransfer.files);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFilePicker();
      }
    };

    return (
      <>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={openFilePicker}
          onKeyDown={handleKeyDown}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`cursor-pointer outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 ${
            isDragging
              ? "border-primary bg-primary/10 ring-2 ring-primary/30"
              : ""
          } ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`}
        >
          {children}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            processFiles(event.target.files, event.target);
          }}
        />
      </>
    );
  },
);

export default FileDropZone;
