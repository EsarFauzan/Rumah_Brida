<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competition_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('nik', 16);
            $table->text('address');
            $table->string('product_name');
            $table->timestamps();

            $table->unique(['competition_id', 'nik']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competition_registrations');
    }
};
