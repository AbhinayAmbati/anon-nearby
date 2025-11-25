<template>
  <div class="min-h-screen bg-black text-green-400 font-mono">
    <!-- Matrix background effect -->
    <MatrixBackground />
    
    <!-- Navigation -->


    <div class="relative z-10">
      <!-- Header -->
      <section class="py-12 px-4 border-b border-green-400/20">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold mb-4 tracking-wider text-green-400">
            PRIVACY POLICY
          </h1>
          <p class="text-green-400/70">
            Last Updated: {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </p>
        </div>
      </section>

      <!-- Content -->
      <section class="py-12 px-4">
        <div class="max-w-4xl mx-auto space-y-8">
          
          <!-- Introduction -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">1. Introduction</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                Welcome to ANON-NEARBY ("we," "our," or "the Service"). We are committed to protecting your privacy and ensuring complete anonymity. This Privacy Policy explains our data practices for our anonymous, location-based chat and file-sharing service.
              </p>
              <p class="font-semibold text-green-400">
                Core Principle: We collect the absolute minimum data necessary to operate the service, and we NEVER store messages, personal information, or permanent user identities.
              </p>
            </div>
          </div>

          <!-- Information We Collect -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">2. Information We Collect</h2>
            <div class="text-green-400/80 space-y-4 leading-relaxed">
              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">2.1 Temporary Location Data</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>Your GPS coordinates (latitude/longitude) are collected ONLY when you actively use the service</li>
                  <li>Location data is stored temporarily in Redis cache for proximity matching</li>
                  <li>Location data is automatically deleted when you disconnect or within 24 hours, whichever comes first</li>
                  <li>We do NOT track your location history or movement patterns</li>
                  <li>We do NOT store your location permanently in any database</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">2.2 Anonymous Session Identifiers</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>Randomly generated session IDs (UUID format) for technical operation</li>
                  <li>Random codenames (e.g., "CipherNode_42") assigned for chat identification</li>
                  <li>Session IDs are hashed and anonymized for abuse detection</li>
                  <li>All session data is deleted upon disconnection</li>
                  <li>We CANNOT link sessions to real-world identities</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">2.3 Technical Data</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>IP addresses (used only for rate limiting and abuse prevention)</li>
                  <li>WebSocket connection metadata</li>
                  <li>Browser user agent (for compatibility)</li>
                  <li>Connection timestamps (for session management)</li>
                  <li>This data is stored temporarily and automatically expires</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">2.4 Abuse Detection Data</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>Anonymous hashes of session IDs for repeat offender tracking</li>
                  <li>Content violation patterns (NOT the actual messages)</li>
                  <li>Rate limiting counters</li>
                  <li>All abuse data expires within 24 hours</li>
                  <li>We do NOT store message content for moderation</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Information We DO NOT Collect -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">3. Information We DO NOT Collect</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-green-400">We explicitly DO NOT collect, store, or process:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>❌ Your name, email, phone number, or any personal identifiers</li>
                <li>❌ Message content or chat history</li>
                <li>❌ User accounts or profiles</li>
                <li>❌ Cookies for tracking or advertising</li>
                <li>❌ Device fingerprints or persistent identifiers</li>
                <li>❌ Social media connections or contacts</li>
                <li>❌ Payment information (service is free)</li>
                <li>❌ Photos, videos, or media files (beyond temporary encrypted file drops)</li>
              </ul>
            </div>
          </div>

          <!-- How We Use Information -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">4. How We Use Information</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>We use the minimal data we collect ONLY for:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>Proximity Matching:</strong> Finding nearby users within your selected radius</li>
                <li><strong>Service Operation:</strong> Maintaining WebSocket connections and chat rooms</li>
                <li><strong>Abuse Prevention:</strong> Detecting spam, harassment, and inappropriate content</li>
                <li><strong>Rate Limiting:</strong> Preventing service abuse and ensuring fair access</li>
                <li><strong>Technical Stability:</strong> Monitoring system performance and uptime</li>
              </ul>
              <p class="font-semibold text-green-400 mt-4">
                We do NOT use your data for advertising, marketing, profiling, or any commercial purposes.
              </p>
            </div>
          </div>

          <!-- Data Storage and Security -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">5. Data Storage and Security</h2>
            <div class="text-green-400/80 space-y-4 leading-relaxed">
              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">5.1 Zero Persistence Architecture</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>Messages exist ONLY in browser memory and WebSocket connections</li>
                  <li>No messages are ever written to disk or permanent storage</li>
                  <li>All chat data is destroyed immediately upon disconnection</li>
                  <li>File drops are encrypted client-side and auto-delete after expiration</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">5.2 Temporary Storage</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>Redis cache for location data (TTL: 24 hours maximum)</li>
                  <li>MongoDB for active session management (auto-deleted on disconnect)</li>
                  <li>All temporary data has automatic expiration</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">5.3 Security Measures</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>TLS/SSL encryption for all data in transit</li>
                  <li>WebSocket secure connections (WSS)</li>
                  <li>Client-side encryption for file drops (AES-256-GCM)</li>
                  <li>Rate limiting and DDoS protection</li>
                  <li>Regular security audits and updates</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Data Sharing -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">6. Data Sharing and Third Parties</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-green-400">We do NOT sell, rent, or share your data with third parties.</p>
              <p>Limited data sharing occurs only in these specific cases:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>AI Moderation:</strong> Message content is analyzed by Google Gemini AI for safety (not stored by Google)</li>
                <li><strong>Infrastructure Providers:</strong> Hosting services may have access to server logs (anonymized)</li>
                <li><strong>Legal Compliance:</strong> We may disclose data if required by law enforcement with valid legal orders</li>
              </ul>
              <p class="mt-4">
                <strong>Note:</strong> Due to our zero-persistence architecture, we have minimal data to share even if legally compelled.
              </p>
            </div>
          </div>

          <!-- Your Rights -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">7. Your Privacy Rights</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>Right to Anonymity:</strong> You can use the service without providing any personal information</li>
                <li><strong>Right to Deletion:</strong> Simply disconnect to delete all your data (automatic)</li>
                <li><strong>Right to Access:</strong> We cannot provide data access because we don't store identifiable data</li>
                <li><strong>Right to Opt-Out:</strong> Stop using the service at any time</li>
                <li><strong>Right to Object:</strong> You control what location data you share</li>
              </ul>
            </div>
          </div>

          <!-- Children's Privacy -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">8. Children's Privacy</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-red-400">
                This service is NOT intended for users under 18 years of age.
              </p>
              <p>
                We do not knowingly collect data from minors. If you are under 18, do not use this service. Parents who believe their child has used this service should contact us immediately.
              </p>
            </div>
          </div>

          <!-- International Users -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">9. International Users</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                This service may be accessed globally. By using the service, you consent to the transfer of your minimal data to our servers, which may be located in different jurisdictions.
              </p>
              <p>
                <strong>GDPR Compliance:</strong> For EU users, our minimal data collection and automatic deletion practices align with GDPR principles of data minimization and purpose limitation.
              </p>
              <p>
                <strong>CCPA Compliance:</strong> California residents have the right to know what data we collect (see Section 2) and request deletion (automatic upon disconnect).
              </p>
            </div>
          </div>

          <!-- Changes to Privacy Policy -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">10. Changes to This Policy</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. Material changes will be posted on this page with an updated "Last Updated" date.
              </p>
              <p>
                Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>

          <!-- Contact -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">11. Contact Us</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                For privacy-related questions or concerns, please contact us through:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>GitHub Issues: <a href="https://github.com/AbhinayAmbati/anon-nearby/issues" target="_blank" class="text-green-400 hover:text-green-300 underline">github.com/AbhinayAmbati/anon-nearby</a></li>
                <li>Open Source Community: Review our code to verify our privacy claims</li>
              </ul>
              <p class="mt-4 font-semibold text-green-400">
                Remember: Due to our anonymous architecture, we cannot respond to individual data requests as we don't store identifiable information.
              </p>
            </div>
          </div>

        </div>
      </section>

      <!-- Back to Home -->
      <section class="py-12 px-4 border-t border-green-400/20">
        <div class="max-w-4xl mx-auto text-center">
          <NuxtLink 
            to="/" 
            class="inline-block px-8 py-4 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-all font-semibold"
          >
            ← BACK TO HOME
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Privacy Policy - ANON-NEARBY',
  description: 'Privacy Policy for ANON-NEARBY anonymous chat service. Zero persistence, complete anonymity, minimal data collection.'
})
</script>
