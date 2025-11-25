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
            TERMS & CONDITIONS
          </h1>
          <p class="text-green-400/70">
            Last Updated: {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </p>
          <p class="text-red-400 font-semibold mt-4">
            ⚠️ PLEASE READ THESE TERMS CAREFULLY BEFORE USING THIS SERVICE
          </p>
        </div>
      </section>

      <!-- Content -->
      <section class="py-12 px-4">
        <div class="max-w-4xl mx-auto space-y-8">
          
          <!-- Acceptance of Terms -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">1. Acceptance of Terms</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                By accessing or using ANON-NEARBY ("the Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must immediately cease using the Service.
              </p>
              <p class="font-semibold text-green-400">
                Your use of the Service constitutes your acceptance of these Terms, whether or not you have read them.
              </p>
            </div>
          </div>

          <!-- Eligibility -->
          <div class="bg-black/40 border border-red-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-red-400">2. Eligibility and Age Restrictions</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-red-400 text-lg">
                ⚠️ YOU MUST BE AT LEAST 18 YEARS OLD TO USE THIS SERVICE
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>By using this Service, you represent and warrant that you are at least 18 years of age</li>
                <li>Users under 18 are STRICTLY PROHIBITED from using this Service</li>
                <li>We reserve the right to request age verification at any time</li>
                <li>Violation of this age requirement will result in immediate termination of access</li>
                <li>Parents/guardians are responsible for monitoring their children's internet usage</li>
              </ul>
            </div>
          </div>

          <!-- Service Description -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">3. Service Description</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>ANON-NEARBY provides:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Anonymous, location-based proximity chat</li>
                <li>Encrypted file drop functionality</li>
                <li>Ephemeral messaging with zero persistence</li>

              </ul>
              <p class="font-semibold text-green-400 mt-4">
                The Service is provided "AS IS" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.
              </p>
            </div>
          </div>

          <!-- Prohibited Conduct -->
          <div class="bg-black/40 border border-red-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-red-400">4. Prohibited Conduct (STRICTLY ENFORCED)</h2>
            <div class="text-green-400/80 space-y-4 leading-relaxed">
              <p class="font-semibold text-red-400 text-lg">
                The following activities are STRICTLY PROHIBITED and will result in immediate ban:
              </p>
              
              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">4.1 Illegal Activities</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>❌ Any illegal activity under local, state, national, or international law</li>
                  <li>❌ Drug trafficking, weapons sales, or other criminal commerce</li>
                  <li>❌ Fraud, scams, phishing, or financial crimes</li>
                  <li>❌ Hacking, unauthorized access, or cybercrime</li>
                  <li>❌ Copyright infringement or intellectual property theft</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">4.2 Harmful Content</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>❌ Child sexual abuse material (CSAM) - ZERO TOLERANCE, reported to authorities</li>
                  <li>❌ Exploitation, abuse, or endangerment of minors</li>
                  <li>❌ Non-consensual intimate images or "revenge porn"</li>
                  <li>❌ Extreme violence, gore, or graphic content</li>
                  <li>❌ Self-harm, suicide promotion, or eating disorder encouragement</li>
                  <li>❌ Terrorism, extremism, or violent radicalization</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">4.3 Harassment and Abuse</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>❌ Harassment, bullying, stalking, or intimidation</li>
                  <li>❌ Hate speech based on race, religion, gender, sexuality, disability, etc.</li>
                  <li>❌ Threats of violence or harm</li>
                  <li>❌ Doxxing or sharing personal information without consent</li>
                  <li>❌ Sexual harassment or unwanted sexual advances</li>
                  <li>❌ Impersonation or identity theft</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">4.4 Spam and Abuse</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>❌ Spam, excessive messaging, or flooding</li>
                  <li>❌ Commercial advertising or solicitation</li>
                  <li>❌ Malware, viruses, or malicious code</li>
                  <li>❌ Automated bots or scripts</li>
                  <li>❌ Service disruption or denial-of-service attacks</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">4.5 Inappropriate Sexual Content</h3>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>❌ Unsolicited sexual content or explicit material</li>
                  <li>❌ Solicitation of sexual services or prostitution</li>
                  <li>❌ Sexual content involving minors (ZERO TOLERANCE)</li>
                  <li>❌ Non-consensual sexual content</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Content Moderation -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">5. Content Moderation and Enforcement</h2>
            <div class="text-green-400/80 space-y-4 leading-relaxed">


              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">5.2 Our Rights</h3>
                <p class="font-semibold text-green-400">
                  We reserve the right to:
                </p>
                <ul class="list-disc list-inside space-y-2 ml-4">
                  <li>Monitor, filter, or remove any content at our sole discretion</li>
                  <li>Suspend or terminate access without notice or explanation</li>
                  <li>Report illegal activity to law enforcement</li>
                  <li>Cooperate with legal investigations</li>
                  <li>Modify or discontinue the Service at any time</li>
                </ul>
              </div>

              <div>
                <h3 class="text-lg font-bold text-green-400 mb-2">5.3 Zero Tolerance Policies</h3>
                <p class="text-red-400 font-semibold">
                  The following result in IMMEDIATE PERMANENT BAN and law enforcement reporting:
                </p>
                <ul class="list-disc list-inside space-y-2 ml-4 text-red-400">
                  <li>Child sexual abuse material (CSAM)</li>
                  <li>Terrorism or violent extremism</li>
                  <li>Human trafficking</li>
                  <li>Credible threats of violence</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- User Responsibilities -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">6. User Responsibilities</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>By using the Service, you agree to:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect other users and maintain civil discourse</li>
                <li>Not share personal information (for your own safety)</li>
                <li>Not attempt to circumvent security measures or bans</li>
                <li>Not reverse engineer, decompile, or hack the Service</li>
                <li>Report violations of these Terms to us</li>
                <li>Accept full responsibility for your conduct</li>
              </ul>
            </div>
          </div>

          <!-- Disclaimer of Warranties -->
          <div class="bg-black/40 border border-yellow-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-yellow-400">7. Disclaimer of Warranties</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-yellow-400 uppercase">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <p>We explicitly disclaim all warranties, including but not limited to:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Uninterrupted, secure, or error-free operation</li>
                <li>Accuracy, reliability, or completeness of content</li>
                <li>Freedom from viruses or harmful components</li>
                <li>Compatibility with your device or software</li>
              </ul>
              <p class="mt-4 font-semibold text-yellow-400">
                YOU USE THE SERVICE AT YOUR OWN RISK.
              </p>
            </div>
          </div>

          <!-- Limitation of Liability -->
          <div class="bg-black/40 border border-red-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-red-400">8. Limitation of Liability</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-red-400 uppercase">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>We are NOT liable for any indirect, incidental, special, consequential, or punitive damages</li>
                <li>We are NOT liable for loss of profits, data, use, goodwill, or other intangible losses</li>
                <li>We are NOT liable for user conduct or content shared by other users</li>
                <li>We are NOT liable for unauthorized access, data breaches, or security incidents</li>
                <li>We are NOT liable for service interruptions, errors, or failures</li>
                <li>Our total liability shall not exceed $0 USD or the amount you paid us (which is $0)</li>
              </ul>
              <p class="mt-4 font-semibold text-red-400">
                YOU ACKNOWLEDGE THAT YOU USE AN ANONYMOUS SERVICE WITH STRANGERS AT YOUR OWN RISK.
              </p>
            </div>
          </div>

          <!-- Indemnification -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">9. Indemnification</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                You agree to indemnify, defend, and hold harmless ANON-NEARBY, its developers, contributors, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any laws or third-party rights</li>
                <li>Content you share or transmit through the Service</li>
                <li>Your interactions with other users</li>
              </ul>
            </div>
          </div>

          <!-- Privacy and Data -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">10. Privacy and Data</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                Your use of the Service is also governed by our <NuxtLink to="/privacy" class="text-green-400 hover:text-green-300 underline font-semibold">Privacy Policy</NuxtLink>.
              </p>
              <p class="font-semibold text-green-400">
                Key points:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>We collect minimal data (location, session IDs)</li>
                <li>Messages are NEVER stored permanently</li>
                <li>All data is automatically deleted upon disconnection</li>
                <li>We cannot recover or provide chat history</li>
                <li>Anonymity is not guaranteed - use caution</li>
              </ul>
            </div>
          </div>

          <!-- Intellectual Property -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">11. Intellectual Property</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                The Service is open source under the MIT License. You may:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Use, modify, and distribute the source code per the MIT License</li>
                <li>Deploy your own instance of the Service</li>
                <li>Contribute to the project on GitHub</li>
              </ul>
              <p class="mt-4">
                However, you may NOT:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Claim ownership of the original code</li>
                <li>Remove copyright notices or attributions</li>
                <li>Use our branding or trademarks without permission</li>
              </ul>
            </div>
          </div>

          <!-- Termination -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">12. Termination</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                We may terminate or suspend your access immediately, without notice, for any reason, including but not limited to:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Illegal activity</li>
                <li>Abusive or harmful conduct</li>
                <li>Suspected security threats</li>
                <li>At our sole discretion</li>
              </ul>
              <p class="mt-4 font-semibold text-green-400">
                Upon termination, your right to use the Service immediately ceases. Due to our zero-persistence architecture, no data recovery is possible.
              </p>
            </div>
          </div>

          <!-- Governing Law -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">13. Governing Law and Dispute Resolution</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
              </p>
              <p>
                Any disputes arising from these Terms or the Service shall be resolved through:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Good faith negotiation first</li>
                <li>Binding arbitration if negotiation fails</li>
                <li>Courts of [Your Jurisdiction] as a last resort</li>
              </ul>
              <p class="mt-4 font-semibold text-green-400">
                YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND CLASS ACTION LAWSUITS.
              </p>
            </div>
          </div>

          <!-- Changes to Terms -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">14. Changes to Terms</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to this page with an updated "Last Updated" date.
              </p>
              <p class="font-semibold text-green-400">
                Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
              <p>
                It is your responsibility to review these Terms periodically.
              </p>
            </div>
          </div>

          <!-- Severability -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">15. Severability and Entire Agreement</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full effect.
              </p>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and ANON-NEARBY regarding the Service.
              </p>
            </div>
          </div>

          <!-- Contact -->
          <div class="bg-black/40 border border-green-400/30 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-green-400">16. Contact Information</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p>
                For questions about these Terms, please contact us through:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>GitHub Issues: <a href="https://github.com/AbhinayAmbati/anon-nearby/issues" target="_blank" class="text-green-400 hover:text-green-300 underline">github.com/AbhinayAmbati/anon-nearby</a></li>
                <li>Open Source Community Discussion</li>
              </ul>
            </div>
          </div>

          <!-- Final Acknowledgment -->
          <div class="bg-red-400/10 border-2 border-red-400 p-6 backdrop-blur-sm">
            <h2 class="text-2xl font-bold mb-4 text-red-400">⚠️ ACKNOWLEDGMENT</h2>
            <div class="text-green-400/80 space-y-3 leading-relaxed">
              <p class="font-semibold text-red-400 text-lg">
                BY USING THIS SERVICE, YOU ACKNOWLEDGE THAT:
              </p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>You have read, understood, and agree to these Terms</li>
                <li>You are at least 18 years old</li>
                <li>You will use the Service responsibly and legally</li>
                <li>You accept all risks associated with anonymous communication</li>
                <li>You understand that violations will result in immediate ban</li>
                <li>You waive any claims against ANON-NEARBY for user conduct</li>
              </ul>
              <p class="mt-4 font-semibold text-red-400">
                IF YOU DO NOT AGREE, DO NOT USE THIS SERVICE.
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
  title: 'Terms & Conditions - ANON-NEARBY',
  description: 'Terms and Conditions for ANON-NEARBY anonymous chat service. Strict rules, prohibited conduct, and user responsibilities.'
})
</script>
