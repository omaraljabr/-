"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// عرض الصفحة الرئيسية
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// إتاحة ملفات CSS وJavaScript والصور
app.use(express.static(__dirname));

if (!process.env.GEMINI_API_KEY) {
    console.error("المفتاح غير موجود. تأكد من GEMINI_API_KEY في ملف .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

app.post("/analyze", async (req, res) => {
    try {
        const { examName, answers } = req.body || {};

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ error: "لا توجد إجابات للتحليل." });
        }

        // نحدّ الحجم لحماية الاستهلاك
        const items = answers.slice(0, 40).map((a, i) => ({
            number: i + 1,
            question: String(a.question || "").slice(0, 500),
            studentAnswer: String(a.studentAnswer || "").slice(0, 300),
            correctAnswer: String(a.correctAnswer || "").slice(0, 300),
            isCorrect: !!a.isCorrect
        }));

        const prompt =
            "أنت مدرّب ومقيّم تعليمي. حلّل إجابات طالب في اختبار اسمه «" +
            String(examName || "اختبار").slice(0, 100) + "».\n" +
            "المطلوب تحليل محتوى الإجابات نفسها (ماذا تدل عليه اختياراته عن فهمه ومهاراته)، " +
            "وليس مجرد عدّ الصحيح والخطأ، ولا تذكر النتيجة أو النسبة.\n" +
            "اكتب بالعربية، بصياغة واضحة ومختصرة، وأعد JSON فقط بهذا الشكل بالضبط:\n" +
            "{\"strengths\":\"...\",\"improvement\":\"...\",\"recommendations\":\"...\",\"trainingPlan\":\"...\"}\n" +
            "- strengths: نقاط القوة المستنتجة من إجاباته.\n" +
            "- improvement: ما يحتاج إتقانه أو تحسينه تحديداً (مهارة أو موضوع) بناءً على إجاباته.\n" +
            "- recommendations: توصيات مبنية على أسلوب إجاباته.\n" +
            "- trainingPlan: خطوات تدريب عملية (مثل: تمارين، قراءة، مواقف تطبيقية).\n" +
            "إذا كانت البيانات قليلة فاذكر أن التحليل استرشادي وغير مؤكد. لا تخترع معلومات غير موجودة.\n\n" +
            "بيانات الإجابات:\n" + JSON.stringify(items);

        // نعيد المحاولة عند الازدحام (503) أو الحد المجاني (429)
        let response;
        const MAX_ATTEMPTS = 5;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: MODEL,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.4
                    }
                });
                break;
            } catch (err) {
                const msg = String(err.message);
                const isQuota = /429|RESOURCE_EXHAUSTED/i.test(msg);
                const isBusy = /503|UNAVAILABLE/i.test(msg);

                if ((!isQuota && !isBusy) || attempt === MAX_ATTEMPTS) throw err;

                const waitSeconds = isQuota ? 50 : attempt * 8;
                console.log("محاولة " + attempt + " فشلت، سأعيد بعد " + waitSeconds + " ثانية...");
                await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
            }
        }

        const text = (response.text || "{}").replace(/```json|```/g, "").trim();
        const data = JSON.parse(text);

        res.json({
            strengths: String(data.strengths || ""),
            improvement: String(data.improvement || ""),
            recommendations: String(data.recommendations || ""),
            trainingPlan: String(data.trainingPlan || "")
        });

    } catch (error) {
        console.error("خطأ في التحليل:", error.message);
        res.status(500).json({ error: "تعذر إنشاء التحليل. تحقق من المفتاح والحدود المجانية." });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log("السيرفر يعمل على http://localhost:" + PORT);
});