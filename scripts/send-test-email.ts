import { sendBackingConfirmation } from "../src/lib/email/backing-confirmation";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: tsx scripts/send-test-email.ts <email>");
    process.exit(1);
  }

  await sendBackingConfirmation({
    backerId: `test-${Date.now()}`,
    to,
    nickname: "テスト太郎",
    projectTitle: "テスト送信：支援完了メールの確認",
    projectPath: "/projects/test",
    amount: 12000,
    feeAmount: 1200,
    totalAmount: 13200,
    items: [
      { reward_title: "オリジナルTシャツ", unit_amount: 5000, quantity: 2 },
      { reward_title: "ステッカーセット", unit_amount: 1000, quantity: 1 },
    ],
    address: {
      country: "JP",
      postal_code: "1000001",
      prefecture: "東京都",
      city: "千代田区",
      address_line1: "千代田1-1",
      recipient_name: "テスト太郎",
    },
  });

  console.log(`Sent test confirmation to ${to}`);
}

main();
