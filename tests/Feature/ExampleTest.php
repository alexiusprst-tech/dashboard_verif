<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_coordinator_can_login_with_seeded_credentials(): void
    {
        $this->seed();

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'coordinator@telkomuniversity.ac.id',
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.email', 'coordinator@telkomuniversity.ac.id');
    }
}
