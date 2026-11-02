"use strict";

// غيّرها إلى true لو تريد ظهور الإجابة الصحيحة في الإكسل
const SHOW_CORRECT_ANSWER = false;
const PASS_MARK = 50;
const ANALYZE_URL = "http://localhost:3000/analyze";

const COLORS = {
    primary: "FF6254E8",
    light: "FFEEECFF",
    border: "FFD9DBE8",
    zebra: "FFFAFAFF",
    green: "FFE4F8ED",
    greenText: "FF16803C",
    red: "FFFDE8E8",
    redText: "FFC62828",
    white: "FFFFFFFF"
};

function loadExcelJS() {
    if (window.ExcelJS) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function exportExamReport(onlyIndex) {

    try {
        await loadExcelJS();
    } catch (error) {
        alert("تعذر تحميل مكتبة Excel. تأكد من الاتصال بالإنترنت ثم حدّث الصفحة.");
        return;
    }

    let results = [];
    let exams = [];

    try {
        results = JSON.parse(localStorage.getItem("examResults") || "[]");
        exams = JSON.parse(localStorage.getItem("exams") || "[]");
    } catch (error) {
        results = [];
        exams = [];
    }

    if (!Array.isArray(results) || results.length === 0) {
        alert("لا توجد نتائج لتصديرها حتى الآن.");
        return;
    }
    if (!Array.isArray(exams)) exams = [];

    const answersOf = (r) => Array.isArray(r.answers) ? r.answers : [];
    const dateOf = (r) => r.submittedAt ? new Date(r.submittedAt).toLocaleString("ar-EG") : "";
    const statusOf = (r) => (Number(r.percentage) || 0) >= PASS_MARK ? "ناجح" : "راسب";

    function isCorrect(a) {
        const c = String(a.correctAnswer || "").trim().toLowerCase();
        const s = String(a.selectedAnswer || "").trim().toLowerCase();
        return c !== "" && c === s;
    }

    function optionsOf(r, a, index) {
        if (a.options && Object.keys(a.options).length) return a.options;
        const exam = exams[r.examIndex];
        const q = exam && Array.isArray(exam.questions) ? exam.questions[index] : null;
        if (q && q.text === a.question && q.options) return q.options;
        return null;
    }

    function answerText(r, a, index, letter) {
        const key = String(letter || "").trim().toLowerCase();
        if (!key) return "بدون إجابة";
        const opts = optionsOf(r, a, index);
        if (opts && opts[key]) return String(opts[key]);
        return "(النص غير متوفر)";
    }

    function safeName(text) {
        return String(text || "").replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 40) || "طالب";
    }

    function thinBorder() {
        const b = { style: "thin", color: { argb: COLORS.border } };
        return { top: b, left: b, bottom: b, right: b };
    }

    function fill(argb) {
        return { type: "pattern", pattern: "solid", fgColor: { argb } };
    }

    function linesNeeded(text, width) {
        return String(text).split("\n").reduce(
            (sum, line) => sum + Math.max(1, Math.ceil(line.length / (width * 0.9))),
            0
        );
    }

    // طلب التحليل من السيرفر (المفتاح عند السيرفر فقط)
    async function fetchAiAnalysis(r) {
        try {
            const payload = {
                examName: r.examName,
                answers: answersOf(r).map((a, i) => ({
                    question: a.question,
                    studentAnswer: answerText(r, a, i, a.selectedAnswer),
                    correctAnswer: answerText(r, a, i, a.correctAnswer),
                    isCorrect: isCorrect(a)
                }))
            };

            const res = await fetch(ANALYZE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error("تعذر الاتصال بالسيرفر:", error);
            return null;
        }
    }

    function buildStudentWorkbook(r, ai) {
        const wb = new ExcelJS.Workbook();
        wb.creator = "ExamPro";

        const widths = SHOW_CORRECT_ANSWER ? [6, 60, 40, 12, 36] : [6, 60, 40, 12];
        const ncols = widths.length;

        const ws = wb.addWorksheet("تقرير الطالب", {
            views: [{ rightToLeft: true }]
        });
        widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

        // العنوان
        ws.mergeCells(1, 1, 1, ncols);
        const title = ws.getCell(1, 1);
        title.value = "ExamPro — تقرير الطالب";
        title.font = { name: "Tahoma", size: 16, bold: true, color: { argb: COLORS.white } };
        title.fill = fill(COLORS.primary);
        title.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(1).height = 34;

        // بيانات الطالب
        function infoRow(rowNumber, label, value) {
            ws.mergeCells(rowNumber, 1, rowNumber, 2);
            ws.mergeCells(rowNumber, 3, rowNumber, ncols);

            const l = ws.getCell(rowNumber, 1);
            l.value = label;
            l.font = { name: "Tahoma", bold: true, color: { argb: COLORS.primary } };
            l.fill = fill(COLORS.light);
            l.alignment = { horizontal: "right", vertical: "middle" };

            const v = ws.getCell(rowNumber, 3);
            v.value = value;
            v.font = { name: "Tahoma" };
            v.alignment = { horizontal: "right", vertical: "middle", wrapText: true };

            for (let c = 1; c <= ncols; c++) ws.getCell(rowNumber, c).border = thinBorder();
            ws.getRow(rowNumber).height = 24;
        }

        infoRow(3, "اسم الطالب", r.studentName || "");
        infoRow(4, "الإيميل", r.email || "");
        infoRow(5, "رقم الجوال", String(r.phone || ""));
        infoRow(6, "الامتحان", r.examName || "");
        infoRow(7, "تاريخ التقديم", dateOf(r));

        // رأس جدول الأسئلة
        const header = ["#", "السؤال", "إجابة الطالب", "النتيجة"];
        if (SHOW_CORRECT_ANSWER) header.push("الإجابة الصحيحة");

        const headerRow = ws.getRow(9);
        header.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font = { name: "Tahoma", bold: true, color: { argb: COLORS.white } };
            cell.fill = fill(COLORS.primary);
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = thinBorder();
        });
        headerRow.height = 28;

        // الأسئلة
        answersOf(r).forEach((a, index) => {
            const correct = isCorrect(a);
            const values = [
                index + 1,
                a.question || "",
                answerText(r, a, index, a.selectedAnswer),
                correct ? "صحيحة" : "خاطئة"
            ];
            if (SHOW_CORRECT_ANSWER) values.push(answerText(r, a, index, a.correctAnswer));

            const row = ws.getRow(10 + index);
            let maxLines = 1;

            values.forEach((value, i) => {
                const cell = row.getCell(i + 1);
                cell.value = value;
                cell.font = { name: "Tahoma" };
                cell.border = thinBorder();
                cell.alignment = {
                    horizontal: i === 0 || i === 3 ? "center" : "right",
                    vertical: "middle",
                    wrapText: true
                };
                if (index % 2 === 1) cell.fill = fill(COLORS.zebra);
                maxLines = Math.max(maxLines, linesNeeded(value, widths[i]));
            });

            const resultCell = row.getCell(4);
            resultCell.font = {
                name: "Tahoma",
                bold: true,
                color: { argb: correct ? COLORS.greenText : COLORS.redText }
            };
            resultCell.fill = fill(correct ? COLORS.green : COLORS.red);

            row.height = Math.max(26, maxLines * 18 + 8);
        });

        // التحليل في آخر الجدول
        let line = 10 + answersOf(r).length + 1;

        ws.mergeCells(line, 1, line, ncols);
        const at = ws.getCell(line, 1);
        at.value = "تحليل أداء الطالب بالذكاء الاصطناعي";
        at.font = { name: "Tahoma", bold: true, size: 14, color: { argb: COLORS.white } };
        at.fill = fill(COLORS.primary);
        at.alignment = { horizontal: "center", vertical: "middle" };
        ws.getRow(line).height = 30;
        line++;

        function analysisRow(label, value) {
            ws.mergeCells(line, 1, line, 2);
            ws.mergeCells(line, 3, line, ncols);

            const l = ws.getCell(line, 1);
            l.value = label;
            l.font = { name: "Tahoma", bold: true, color: { argb: COLORS.primary } };
            l.fill = fill(COLORS.light);
            l.alignment = { horizontal: "right", vertical: "middle", wrapText: true };

            const v = ws.getCell(line, 3);
            v.value = value;
            v.font = { name: "Tahoma" };
            v.alignment = { horizontal: "right", vertical: "middle", wrapText: true };

            for (let c = 1; c <= ncols; c++) ws.getCell(line, c).border = thinBorder();

            const totalWidth = widths.slice(2).reduce((x, y) => x + y, 0);
            ws.getRow(line).height = Math.max(26, linesNeeded(value, totalWidth) * 18 + 8);
            line++;
        }

        if (ai) {
            analysisRow("نقاط القوة", ai.strengths);
            analysisRow("ما يحتاج إتقانه", ai.improvement);
            analysisRow("التوصيات", ai.recommendations);
            analysisRow("خطة التطوير", ai.trainingPlan);
            analysisRow("تنبيه", "تحليل مولّد بالذكاء الاصطناعي من محتوى الإجابات، وهو استرشادي وليس تقييماً نهائياً.");
        } else {
            analysisRow(
                "تحليل الذكاء الاصطناعي",
                "تعذر إنشاء التحليل. تأكد من تشغيل السيرفر (node server.js) ومن وجود رصيد في OpenAI."
            );
        }

        return wb;
    }

    async function downloadWorkbook(r, fileName) {
        const ai = await fetchAiAnalysis(r);
        const wb = buildStudentWorkbook(r, ai);
        const buffer = await wb.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    if (typeof onlyIndex === "number") {
        const r = results[onlyIndex];
        if (!r) {
            alert("تعذر العثور على هذه النتيجة.");
            return;
        }
        await downloadWorkbook(
            r,
            "ExamPro-" + safeName(r.studentName) + "-" + safeName(r.examName) + ".xlsx"
        );
        return;
    }

    results.forEach((r, i) => {
        const fileName =
            "ExamPro-" + safeName(r.studentName) + "-" + safeName(r.examName) + "-" + (i + 1) + ".xlsx";
        setTimeout(() => downloadWorkbook(r, fileName), i * 500);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-export-report]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            exportExamReport();
        });
    });
});