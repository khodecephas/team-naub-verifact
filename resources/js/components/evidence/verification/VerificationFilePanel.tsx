import InputError from '@/Components/InputError';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';
import { FileCheck2, FileUp, UploadCloud } from 'lucide-react';
import { DragEvent, useRef, useState } from 'react';

interface VerificationFilePanelProps {
    file: File | null;
    error?: string;
    maxUploadSizeKb: number;
    onFileChange: (file: File | null) => void;
}

export function VerificationFilePanel({
    file,
    error,
    maxUploadSizeKb,
    onFileChange,
}: VerificationFilePanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const dropFile = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        onFileChange(event.dataTransfer.files?.[0] ?? null);
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded bg-blue-800 text-white">
                        <FileCheck2 className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle>File to verify</CardTitle>
                        <CardDescription>Select a local file for one-time comparison</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex min-h-[390px] flex-col">
                <div
                    onDragEnter={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setDragging(false)}
                    onDrop={dropFile}
                    className={cn(
                        'flex flex-1 flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors',
                        dragging
                            ? 'border-blue-600 bg-blue-50'
                            : file
                              ? 'border-blue-300 bg-blue-50/40'
                              : 'border-slate-300 bg-slate-50',
                    )}
                >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                        {file ? (
                            <FileUp className="h-7 w-7 text-blue-700" />
                        ) : (
                            <UploadCloud className="h-7 w-7 text-slate-500" />
                        )}
                    </span>

                    {file ? (
                        <div className="mt-4">
                            <p className="max-w-sm break-all text-base font-bold text-slate-900">
                                {file.name}
                            </p>
                            <p className="pt-1 text-sm text-slate-500">
                                Size: {formatBytes(file.size)}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <p className="text-base font-bold text-slate-900">Drop comparison file here</p>
                            <p className="pt-1 text-sm text-slate-500">or browse this workstation</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="mt-5 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        {file ? 'Choose another file' : 'Browse file'}
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        className="sr-only"
                        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                    />
                    <p className="pt-3 text-xs text-slate-400">
                        Maximum {formatBytes(maxUploadSizeKb * 1024)} · file is not retained
                    </p>
                </div>

                <InputError message={error} className="mt-3" />
            </CardContent>
        </Card>
    );
}
