<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index()
    {
        return Template::all();
    }

    public function show($id)
    {
        return Template::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $template = Template::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string',
            'subject' => 'nullable|string',
            'content' => 'required|string',
            'email_body' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        // If setting as default, unset others of the same type
        if ($validated['is_default'] ?? false) {
            Template::where('type', $template->type)->update(['is_default' => false]);
        }

        $template->update($validated);

        return $template;
    }

    public function getByType($type)
    {
        return Template::where('type', $type)->get();
    }

    public function getDefault($type)
    {
        return Template::where('type', $type)->where('is_default', true)->first() 
            ?? Template::where('type', $type)->first();
    }
}
