
"use strict";

document.addEventListener("DOMContentLoaded", function () {

    const btnNewExam = document.getElementById("btn-new-exam");
    const examsContainer = document.getElementById("exams-body");

    const totalExams = document.getElementById("total-exams");
    const activeExams = document.getElementById("active-exams");
    const inactiveExams = document.getElementById("inactive-exams");

    // الانتقال إلى إنشاء امتحان جديد
    if (btnNewExam) {
        btnNewExam.addEventListener("click", function () {
            localStorage.removeItem("editExamIndex");
            window.location.href = "create-exam.html";
        });
    }

    // قراءة الامتحانات
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

    // حفظ الامتحانات
    function saveExams(exams) {
        try {
            localStorage.setItem("exams", JSON.stringify(exams));
            return true;
        } catch (error) {
            console.error("خطأ في حفظ الامتحانات:", error);
            alert("تعذر حفظ التغييرات في المتصفح.");
            return false;
        }
    }

    // إنشاء عنصر نصي
    function createText(tag, className, text) {
        const element = document.createElement(tag);

        element.className = className;
        element.textContent = text ?? "";

        return element;
    }

    // إنشاء زر
    function createButton(text, className, callback) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = className;
        button.textContent = text;
        button.addEventListener("click", callback);

        return button;
    }

    // تحديث الإحصائيات
    function updateStatistics(exams) {
        if (totalExams) {
            totalExams.textContent = exams.length;
        }

        const active = exams.filter(function (exam) {
            return !exam.hidden;
        }).length;

        if (activeExams) {
            activeExams.textContent = active;
        }

        if (inactiveExams) {
            inactiveExams.textContent = exams.length - active;
        }
    }

    // إنشاء بطاقة امتحان
    function createExamCard(exam, index) {

        const card = document.createElement("article");
        card.className = "exam-card";

        const header = document.createElement("div");
        header.className = "exam-card-header";

        const icon = createText("div", "exam-card-icon", "📝");

        const titleBox = document.createElement("div");
        titleBox.className = "exam-card-title";

        titleBox.append(
            createText("h3", "", exam.name || "امتحان بدون اسم"),
            createText(
                "span",
                "exam-language",
                exam.arabic ? "العربية" : "الإنجليزية"
            )
        );

        const status = createText(
            "span",
            exam.hidden ? "exam-status hidden" : "exam-status active",
            exam.hidden ? "مخفي" : "نشط"
        );

        header.append(icon, titleBox, status);

        const description = createText(
            "p",
            "exam-description",
            exam.description || "لا يوجد وصف لهذا الامتحان."
        );

        const details = document.createElement("div");
        details.className = "exam-details";

        const questionInfo = document.createElement("div");
        questionInfo.className = "exam-detail-item";

        questionInfo.append(
            createText("span", "detail-label", "عدد الأسئلة"),
            createText(
                "strong",
                "detail-value",
                String(
                    Array.isArray(exam.questions)
                        ? exam.questions.length
                        : 0
                )
            )
        );

        const maxQuestionsInfo = document.createElement("div");
        maxQuestionsInfo.className = "exam-detail-item";

        maxQuestionsInfo.append(
            createText("span", "detail-label", "الحد الأقصى للأسئلة"),
            createText(
                "strong",
                "detail-value",
                String(exam.maxQuestions ?? 0)
            )
        );

        const resultInfo = document.createElement("div");
        resultInfo.className = "exam-detail-item";

        resultInfo.append(
            createText("span", "detail-label", "عرض النتيجة"),
            createText(
                "strong",
                "detail-value",
                exam.showResult === "yes" ? "نعم" : "لا"
            )
        );

        details.append(questionInfo, maxQuestionsInfo, resultInfo);

        const actions = document.createElement("div");
        actions.className = "exam-card-actions";

        // إضافة سؤال
        const addQuestionButton = createButton(
            "＋ إضافة سؤال",
            "btn-row btn-add-question",
            function () {
                localStorage.setItem(
                    "selectedExamIndex",
                    String(index)
                );

                window.location.href = "add-question.html";
            }
        );

        // عرض الأسئلة
        const viewQuestionsButton = createButton(
            "عرض الأسئلة",
            "btn-row btn-view-questions",
            function () {
                localStorage.setItem(
                    "selectedExamIndex",
                    String(index)
                );

                window.location.href = "view-questions.html";
            }
        );

        // تعديل بيانات الامتحان
        const editButton = createButton(
            "تعديل الامتحان",
            "btn-row btn-edit-exam",
            function () {
                localStorage.setItem(
                    "editExamIndex",
                    String(index)
                );

                window.location.href = "create-exam.html";
            }
        );

        // حذف الامتحان
        const deleteButton = createButton(
            "حذف الامتحان",
            "btn-row btn-delete-exam",
            function () {

                const confirmed = confirm(
                    "هل تريد حذف الامتحان \"" +
                    (exam.name || "بدون اسم") +
                    "\" وجميع أسئلته؟"
                );

                if (!confirmed) {
                    return;
                }

                const exams = getExams();

                // التأكد أن الامتحان ما زال موجودًا
                if (index < 0 || index >= exams.length) {
                    alert("لم يتم العثور على الامتحان.");
                    renderExams();
                    return;
                }

                exams.splice(index, 1);

                if (saveExams(exams)) {

                    // تحديث رقم الامتحان المحدد إن كان موجودًا
                    const selectedIndex = localStorage.getItem(
                        "selectedExamIndex"
                    );

                    if (selectedIndex !== null) {
                        const selected = Number(selectedIndex);

                        if (selected === index) {
                            localStorage.removeItem("selectedExamIndex");
                        } else if (selected > index) {
                            localStorage.setItem(
                                "selectedExamIndex",
                                String(selected - 1)
                            );
                        }
                    }

                    renderExams();

                    alert("تم حذف الامتحان بنجاح.");
                }
            }
        );

        actions.append(
            addQuestionButton,
            viewQuestionsButton,
            editButton,
            deleteButton
        );

        card.append(
            header,
            description,
            details,
            actions
        );

        return card;
    }

    // عرض جميع الامتحانات
    function renderExams() {

        if (!examsContainer) {
            console.error(
                'لم يتم العثور على العنصر exams-body في admin.html'
            );
            return;
        }

        const exams = getExams();

        examsContainer.replaceChildren();

        updateStatistics(exams);

        if (exams.length === 0) {

            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            emptyState.append(
                createText("div", "empty-icon", "📚"),
                createText("h3", "", "لا توجد امتحانات حتى الآن"),
                createText(
                    "p",
                    "",
                    "اضغط على إنشاء امتحان جديد للبدء."
                )
            );

            examsContainer.appendChild(emptyState);
            return;
        }

        exams.forEach(function (exam, index) {
            const card = createExamCard(exam, index);
            examsContainer.appendChild(card);
        });
    }

    // تشغيل الصفحة
    renderExams();

});

