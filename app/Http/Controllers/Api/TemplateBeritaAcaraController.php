<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BeritaAcara\UploadTemplateBaRequest;
use App\Http\Resources\TemplateBeritaAcaraResource;
use App\Services\TemplateBeritaAcaraService;
use App\Exceptions\BusinessException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Storage;

class TemplateBeritaAcaraController extends Controller
{
    protected TemplateBeritaAcaraService $templateBaService;

    public function __construct(TemplateBeritaAcaraService $templateBaService)
    {
        $this->templateBaService = $templateBaService;
    }

    public function index(Request $request): JsonResponse
    {
        $templates = $this->templateBaService->all();

        return TemplateBeritaAcaraResource::collection($templates)->additional([
            'success' => true,
            'message' => 'Data template Berita Acara berhasil diambil.'
        ])->response();
    }

    public function active(Request $request): JsonResponse
    {
        $template = $this->templateBaService->getActive();

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template Berita Acara belum tersedia.'
            ], 404);
        }

        return (new TemplateBeritaAcaraResource($template))->additional([
            'success' => true,
            'message' => 'Template Berita Acara aktif berhasil diambil.'
        ])->response();
    }

    public function store(UploadTemplateBaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $file = $request->file('file_template');

        $template = $this->templateBaService->upload(
            $data['nama_template'],
            $file,
            $request->user()
        );

        return (new TemplateBeritaAcaraResource($template))->additional([
            'success' => true,
            'message' => 'Template Berita Acara berhasil diunggah.'
        ])->response();
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        $template = $this->templateBaService->activate($id, $request->user());

        return (new TemplateBeritaAcaraResource($template))->additional([
            'success' => true,
            'message' => 'Template Berita Acara berhasil diaktifkan.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->templateBaService->delete($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Template Berita Acara berhasil dihapus.'
        ]);
    }

    public function download(Request $request, int $id): BinaryFileResponse
    {
        // Only Super Admin can download templates
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengunduh file template ini.');
        }

        $template = \App\Models\BeritaAcaraTemplate::find($id);
        if (!$template) {
            abort(404, 'Template tidak ditemukan.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk('local')->path($template->file_path);
        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($template->file_path)) {
            abort(404, 'File template tidak ditemukan di server.');
        }

        $downloadName = $template->nama_file ?: ($template->nama_template . '.docx');
        return response()->download($path, $downloadName);
    }
}
