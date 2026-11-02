
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    const examTitle = document.getElementById("exam-title");
    const examDescription = document.getElementById("exam-description");
    const questionsCount = document.getElementById("questions-count");
    const questionsLimit = document.getElementById("questions-limit");
    const questionsContainer = document.getElementById("questions-container");

    // قراءة الامتحانات المحفوظة
    function getExams() {
        try {
            const data = localStorage.getItem("exams");
            const exams = data ? JSON.parse(data) : [];

            return Array.isArray(exams) ? exams : [];
        } catch (error) {
            console.error("خطأ في قراءة الامتحانات:", error);
            return [];
        }
    }

    // قراءة رقم الامتحان المحدد
    const selectedIndex = Number(
        localStorage.getItem("selectedExamIndex")
    );

    const exams = getExams();

    // التحقق من صحة الامتحان المحدد
    if (
        localStorage.getItem("selectedExamIndex") === null ||
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= exams.length
    ) {
        examTitle.textContent = "لم يتم تحديد امتحان";
        examDescription.textContent =
            "ارجع إلى لوحة الإدارة واختر الامتحان الذي تريد عرض أسئلته.";

        questionsContainer.replaceChildren();

        const message = document.createElement("p");
        message.textContent = "لا يوجد امتحان محدد لعرض أسئلته.";

        questionsContainer.appendChild(message);
        return;
    }

    const exam = exams[selectedIndex];

    // تجهيز قائمة الأسئلة إذا لم تكن موجودة
    if (!Array.isArray(exam.questions)) {
        exam.questions = [];
        localStorage.setItem("exams", JSON.stringify(exams));
    }

    // عرض معلومات الامتحان
    examTitle.textContent = exam.name || "امتحان بدون اسم";

    examDescription.textContent =
        exam.description || "لا يوجد وصف لهذا الامتحان.";

    questionsLimit.textContent = String(exam.maxQuestions ?? 0);

    // إنشاء عنصر نصي آمن
    function createText(tag, className, text) {
        const element = document.createElement(tag);

        element.className = className;
        element.textContent = text ?? "";

        return element;
    }

    // حفظ التغييرات
    function saveExams() {
        try {
            localStorage.setItem("exams", JSON.stringify(exams));
            return true;
        } catch (error) {
            console.error("خطأ في حفظ الأسئلة:", error);
            alert("تعذر حفظ التغييرات. حاول مرة أخرى.");
            return false;
        }
    }

    // تحديث عدد الأسئلة
    function updateCount() {
        questionsCount.textContent = String(exam.questions.length);
    }

    // عرض الأسئلة
    function renderQuestions() {
        questionsContainer.replaceChildren();
        updateCount();

        if (exam.questions.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            emptyState.append(
                createText("h3", "", "لا توجد أسئلة حتى الآن"),
                createText(
                    "p",
                    "",
                    "ارجع إلى لوحة الإدارة واضغط على إضافة سؤال."
                )
            );

            questionsContainer.appendChild(emptyState);
            return;
        }

        exam.questions.forEach(function (question, index) {

            const card = document.createElement("article");
            card.className = "exam-card";

            card.appendChild(
                createText(
                    "h3",
                    "",
                    "السؤال " + (index + 1)
                )
            );

            card.appendChild(
                createText(
                    "p",
                    "exam-description",
                    question.text || "سؤال بدون نص"
                )
            );

            const optionsList = document.createElement("div");
            optionsList.className = "exam-details";

            const options = question.options || {};

            ["a", "b", "c", "d"].forEach(function (key) {

                const optionText = options[key] || "";

                const isCorrect = question.correctAnswer === key;

                const option = createText(
                    "p",
                    "question-option",
                    String(key.toUpperCase()) + ": " +
                    optionText +
                    (isCorrect ? " ✓ الإجابة الصحيحة" : "")
                );

                optionsList.appendChild(option);
            });

            card.appendChild(optionsList);

            // زر تعديل السؤال
            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.className = "btn-row btn-edit-exam";
            editButton.textContent = "تعديل السؤال";

                      editButton.addEventListener("click", function () {
                window.location.href =
                    "add-question.html?exam=" + selectedIndex + "&q=" + index;
            });

            // زر حذف السؤال
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "btn-row btn-delete-exam";
            deleteButton.textContent = "حذف السؤال";

            deleteButton.addEventListener("click", function () {

                const confirmed = confirm(
                    "هل أنت متأكد من حذف السؤال رقم " +
                    (index + 1) +
                    "؟"
                );

                if (!confirmed) {
                    return;
                }

                exam.questions.splice(index, 1);

                if (saveExams()) {
                    renderQuestions();
                }
            });

            const actions = document.createElement("div");
            actions.className = "exam-card-actions";

            actions.append(editButton, deleteButton);
            card.appendChild(actions);

            questionsContainer.appendChild(card);
        });
    }

    renderQuestions();

});

