<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('innovations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title');
            $table->string('innovator_name');

            $table->string('innovation_type');

            $table->string('government_affair');

            $table->date('trial_date')->nullable();
            $table->date('implementation_date')->nullable();
            $table->date('ratification_date')->nullable();

            $table->string('profile_pdf_path')->nullable();
            $table->string('profile_pdf_original_name')->nullable();

            $table->string('report_pdf_path')->nullable();
            $table->string('report_pdf_original_name')->nullable();

            $table->unsignedSmallInteger('reporting_year');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('innovations');
    }
};