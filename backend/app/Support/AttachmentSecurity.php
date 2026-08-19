<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class AttachmentSecurity
{
    private const EXTENSIONS = 'pdf,jpg,jpeg,png,webp,gif,doc,docx,xls,xlsx,csv,txt';

    private const MIMETYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'text/plain',
    ];

    /**
     * Validate business attachments by client extension and detected content.
     *
     * The generated storage name uses the detected extension, not the client
     * filename, so a stored attachment can never retain an executable suffix.
     *
     * @return array<int, string>
     */
    public static function rules(): array
    {
        return [
            'required',
            'file',
            'max:10240',
            'extensions:' . self::EXTENSIONS,
            'mimes:' . self::EXTENSIONS,
            'mimetypes:' . implode(',', self::MIMETYPES),
        ];
    }

    public static function store(UploadedFile $file, string $directory): string
    {
        $extension = strtolower($file->extension());

        if (!in_array($extension, explode(',', self::EXTENSIONS), true)) {
            throw new \InvalidArgumentException('Unsupported attachment type.');
        }

        return Storage::disk('public')->putFileAs(
            $directory,
            $file,
            Str::uuid() . '.' . $extension
        );
    }
}
