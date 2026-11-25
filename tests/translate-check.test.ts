import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTranslation, toLatinDigits } from "../engine/translate-check";

const EN = "Vikram, 3.1% of your customers come back; the rest of LKO-01 manages 8.2%. ₹22,400 is at stake in the next 28 days.";

test("passes when the translation has the same numbers", () => {
  const hi = "विक्रम, आपके 3.1% ग्राहक वापस आते हैं; LKO-01 के बाकी लोग 8.2% लाते हैं। अगले 28 दिनों में ₹22,400 दांव पर है।";
  assert.deepEqual(checkTranslation(EN, hi), { passed: true, reasons: [] });
});

test("fails on a changed number", () => {
  const hi = "विक्रम, आपके 3.1% ग्राहक वापस आते हैं; LKO-01 के बाकी लोग 8.5% लाते हैं। अगले 28 दिनों में ₹22,400 दांव पर है।";
  const r = checkTranslation(EN, hi);
  assert.equal(r.passed, false);
  assert.ok(r.reasons.some((x) => x.includes("missing number pct:8.2")));
  assert.ok(r.reasons.some((x) => x.includes("extra number pct:8.5")));
});

test("fails on a missing number", () => {
  const hi = "विक्रम, आपके 3.1% ग्राहक वापस आते हैं; LKO-01 के बाकी लोग 8.2% लाते हैं। ₹22,400 दांव पर है।";
  const r = checkTranslation(EN, hi);
  assert.equal(r.passed, false);
  assert.deepEqual(r.reasons, ["missing number n:28"]);
});

test("fails on a dropped store code and on an empty translation", () => {
  const hi = "विक्रम, आपके 3.1% ग्राहक वापस आते हैं; बाकी स्टोर 8.2% लाता है। अगले 28 दिनों में ₹22,400 दांव पर है।";
  assert.deepEqual(checkTranslation(EN, hi).reasons, ["missing code LKO-01"]);
  assert.equal(checkTranslation(EN, null).passed, false);
});

test("accepts Devanagari and Bengali digits equal to the English", () => {
  const hi = "विक्रम, आपके ३.१% ग्राहक वापस आते हैं; LKO-01 के बाकी लोग ८.२% लाते हैं। अगले २८ दिनों में ₹२२,४०० दांव पर है।";
  const bn = "বিক্রম, আপনার ৩.১% গ্রাহক ফিরে আসেন; LKO-01-এর বাকিরা ৮.২%। পরের ২৮ দিনে ₹২২,৪০০ ঝুঁকিতে।";
  assert.equal(checkTranslation(EN, hi).passed, true);
  assert.deepEqual(checkTranslation(EN, bn), { passed: true, reasons: [] });
  assert.equal(toLatinDigits("০১২৩৪৫৬৭৮৯ ०१२"), "0123456789 012");
});

test("with a language, Romanised text fails and native script passes", () => {
  const roman = "Vikram, aapke 3.1% customer wapas aate hain; LKO-01 ke baaki log 8.2% laate hain. Agle 28 din mein ₹22,400 daav par hai.";
  const r = checkTranslation(EN, roman, "hi");
  assert.equal(r.passed, false);
  assert.ok(r.reasons[0].startsWith("not in Devanagari script"));
  const hi = "विक्रम, आपके 3.1% ग्राहक वापस आते हैं; LKO-01 के बाकी लोग 8.2% लाते हैं। अगले 28 दिनों में ₹22,400 दांव पर है।";
  assert.equal(checkTranslation(EN, hi, "hi").passed, true);
  assert.equal(checkTranslation(EN, hi, "bn").passed, false);
});
