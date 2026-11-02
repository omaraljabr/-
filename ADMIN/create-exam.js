
"use strict";

// عناصر النموذج
const examForm = document.getElementById("create-exam-form");

const examName = document.getElementById("examName");
const examDesc = document.getElementById("examDesc");
const maxQuestions = document.getElementById("maxQuestions");
const showResult = document.getElementById("showResult");
const arabicExam = document.getElementById("arabicExam");
const hideExam = document.getElementById("hideExam");

// قراءة الامتحانات المحفوظة
function getExams() {
    try {
        const exams = JSON.parse(localStorage.getItem("exams") || "[]");

        return Array.isArray(exams) ? exams : [];
    } catch (error) {
        console.error("حدث خطأ أثناء قراءة الامتحانات:", error);

        return [];
    }
}

// حفظ الامتحانات
function saveExams(exams) {
    localStorage.setItem("exams", JSON.stringify(exams));
}

// معرفة هل الصفحة في وضع التعديل
const editExamIndex = localStorage.getItem("editExamIndex");

let editingExam = false;
let originalExam = null;

// تحميل بيانات الامتحان عند التعديل
if (editExamIndex !== null) {
    const exams = getExams();
    const index = Number(editExamIndex);

    if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < exams.length
    ) {
        originalExam = exams[index];
        editingExam = true;

        examName.value = originalExam.name || "";
        examDesc.value = originalExam.description || "";

        maxQuestions.value = String(
            originalExam.maxQuestions ?? "5"
        );

        showResult.value = originalExam.showResult || "no";

        arabicExam.checked = Boolean(originalExam.arabic);
        hideExam.checked = Boolean(originalExam.hidden);

        // تغيير عنوان الصفحة وزر الحفظ
        const heading = document.querySelector(".welcome-section h2");

        if (heading) {
            heading.textContent = "تعديل الامتحان";
        }

        const formHeading = document.querySelector(".form-card-header h3");

        if (formHeading) {
            formHeading.textContent = "تعديل معلومات الامتحان";
        }

        const submitButton = examForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.innerHTML = "<span>✓</span> حفظ التعديلات";
        }
    } else {
        // فهرس غير صالح
        localStorage.removeItem("editExamIndex");
    }
}

// حفظ النموذج
if (examForm) {
    examForm.addEventListener("submit", function (event) {

    const name = examName.value.trim();

    if (!name) {
        alert("يرجى إدخال اسم الامتحان.");

        examName.focus();

        return;
    }

    const exams = getExams();

    // تكوين بيانات الامتحان
    const exam = {
        id: editingExam ? originalExam.id : Date.now(),

        name: name,

        description: examDesc.value.trim(),

        maxQuestions: maxQuestions.value,

        showResult: showResult.value,

        arabic: arabicExam.checked,

        hidden: hideExam.checked
    };

    if (editingExam) {
        const index = Number(editExamIndex);

        // التأكد من وجود الامتحان
        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= exams.length
        ) {
            alert("تعذر العثور على الامتحان المراد تعديله.");

            localStorage.removeItem("editExamIndex");

            window.location.href = "admin.html";

            return;
        }

        // الاحتفاظ بالخصائص الأخرى، مثل الأسئلة، إن وجدت
        exams[index] = {
            ...exams[index],
            ...exam
        };
    } else {
        exams.push(exam);
    }

    try {
        saveExams(exams);

        localStorage.removeItem("editExamIndex");

        alert(
            editingExam
                ? "تم تعديل الامتحان بنجاح."
                : "تم إنشاء الامتحان بنجاح."
        );

    console.log("تم حفظ الامتحانات:", localStorage.getItem("exams"));

alert("تم الحفظ. افحص Console لمعرفة بيانات الامتحانات.");

window.location.href = "admin.html";

    } catch (error) {
        console.error("تعذر حفظ الامتحان:", error);

        alert("تعذر حفظ الامتحان. تحقق من مساحة التخزين المتاحة.");
    }
});
}