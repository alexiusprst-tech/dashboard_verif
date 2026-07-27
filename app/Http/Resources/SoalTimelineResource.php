<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SoalTimelineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this['id'] ?? null,
            'status'      => $this['status'] ?? '',
            'status_label'=> $this['status_label'] ?? '',
            'icon_status' => $this['icon_status'] ?? 'circle',
            'color'       => $this['color'] ?? 'blue',
            'actor_name'  => $this['actor_name'] ?? 'System',
            'actor_role'  => $this['actor_role'] ?? '',
            'description' => $this['description'] ?? '',
            'date'        => $this['date'] ?? '',
            'time'        => $this['time'] ?? '',
            'created_at'  => $this['created_at'] ?? null,
        ];
    }
}
