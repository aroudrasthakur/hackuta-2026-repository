export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  console.log("\n");
  console.log("━".repeat(70));
  console.log("📧 VERIFICATION EMAIL (Mock)");
  console.log("━".repeat(70));
  console.log(`To: ${email}`);
  console.log(`Subject: ${code} is your HackUTA verification code`);
  console.log("─".repeat(70));
  console.log(`Your HackUTA 2026 verification code is:\n`);
  console.log(`    ${code.split("").join(" ")}`);
  console.log(`\nThis code expires in 10 minutes.`);
  console.log("━".repeat(70));
  console.log("👉 Copy the code above and paste it in the form to continue.\n");
}
