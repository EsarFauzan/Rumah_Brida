<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_proposals', function (Blueprint $table) {
            $table->id();
            $table->string('researcher_name')->nullable();
            $table->string('proposal_title')->nullable();
            $table->string('institution')->nullable();
            $table->string('research_coordinates')->nullable();
            $table->text('chapter_one')->nullable();
            $table->text('chapter_two')->nullable();
            $table->text('chapter_three')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('pdf_original_name')->nullable();
            $table->enum('status', ['draft', 'submitted'])->default('draft')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_proposals');
    }
};
