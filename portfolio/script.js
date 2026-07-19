        // معاينة البيانات
        function previewData() {
            const data = collectData();
            const previewBox = document.getElementById('previewBox');
            const preview = document.getElementById('jsonPreview');
            
            preview.textContent = JSON.stringify(data, null, 2);
            previewBox.style.display = 'block';
            
            showNotification('Data preview generated', 'info');
        }
        
        // حفظ البيانات على GitHub
        async function saveToGitHub() {
            if (!githubToken) {
                showNotification('Please login first!', 'error');
                return;
            }
            
            if (!confirm('Are you sure you want to publish all changes to your portfolio?')) {
                return;
            }
            
            showLoading(true);
            
            try {
                const data = collectData();
                
                // حفظ content.json
                const contentData = {
                    en: data.en,
                    de: data.de
                };
                
                // حفظ projects.json
                const projectsData = data.projects;
                
                // رفع الملفات إلى GitHub
                await updateFileOnGitHub('data/content.json', JSON.stringify(contentData, null, 2));
                await updateFileOnGitHub('data/projects.json', JSON.stringify(projectsData, null, 2));
                
                // تحديث script.js
                await updateScriptFile(data);
                
                showNotification('✅ All changes published successfully!', 'success');
                updateSummary();
                
            } catch (error) {
                showNotification('❌ Error: ' + error.message, 'error');
                console.error(error);
            } finally {
                showLoading(false);
            }
        }
        
        // تحديث ملف script.js
        async function updateScriptFile(data) {
            const scriptContent = generateScriptContent(data);
            await updateFileOnGitHub('script.js', scriptContent);
        }
        
        // إنشاء محتوى script.js
        function generateScriptContent(data) {
            const contentData = {
                en: data.en,
                de: data.de
            };
            
            // إضافة المشاريع إلى content
            data.projects.forEach((project, index) => {
                const num = index + 1;
                contentData.en[`project${num}Title`] = project.en.title;
                contentData.en[`project${num}Description`] = project.en.description;
                contentData.en[`project${num}Skills`] = project.en.skills;
                contentData.de[`project${num}Title`] = project.de.title;
                contentData.de[`project${num}Description`] = project.de.description;
                contentData.de[`project${num}Skills`] = project.de.skills;
            });
            
            return `const content = ${JSON.stringify(contentData, null, 2)};

let currentLanguage = 'en';

function updateSkillsList() {
  const skillsList = document.getElementById('skills-list');
  skillsList.innerHTML = content[currentLanguage].skillsItems
    .map(item => \`<li>\${item}</li>\`)
    .join('');
}

function updateCoursesList() {
  const coursesList = document.getElementById('courses-list');
  coursesList.innerHTML = content[currentLanguage].coursesItems
    .map(item => \`<li>\${item}</li>\`)
    .join('');
}

function setLanguage(lang) {
  currentLanguage = lang;
  const langContent = content[lang];

  const textElements = {
    'name': langContent.name,
    'jobname': langContent.jobname,
    'title': langContent.title,
    'about': langContent.about,
    'skills-title': langContent.skills,
    'projects-title': langContent.projects,
    'all-projects-text': langContent.allProjects,
    'click-to-view-text': langContent.clickToView,
    'my-projects-text': langContent.myProjects,
    'skills-used-text': langContent.skillsUsed,
    'download-project1-text': langContent.downloadProject,
    'download-project2-text': langContent.downloadProject,
    'download-project3-text': langContent.downloadProject,
    'download-project4-text': langContent.downloadProject,
    'cours-title': langContent.courses,
    'contact-title': langContent.contact,
    'cv-btn': langContent.cv,
    'footer-text': langContent.footer
  };

  // إضافة المشاريع ديناميكياً
  const projectCount = Object.keys(langContent).filter(key => key.startsWith('project') && key.endsWith('Title')).length;
  for (let i = 1; i <= projectCount; i++) {
    textElements[\`project\${i}-title\`] = langContent[\`project\${i}Title\`];
    textElements[\`project\${i}-description\`] = langContent[\`project\${i}Description\`];
    textElements[\`project\${i}-skills\`] = langContent[\`project\${i}Skills\`];
  }

  for (const [id, text] of Object.entries(textElements)) {
    const element = document.getElementById(id);
    if (element) {
      if (id === 'about' || id.includes('description') || id.includes('skills')) {
        element.innerHTML = text;
      } else {
        element.textContent = text;
      }
    }
  }

  document.getElementById('email-text').innerHTML = 
    langContent.email.replace(': ', ': <a href="mailto:ehab.ali.gomaa256@gmail.com">') + '</a>';
  
  document.getElementById('linkedin-text').innerHTML = 
    langContent.linkedin.replace(': ', ': <a href="https://linkedin.com/in/ehab-ali25" target="_blank">') + '</a>';
  
  document.getElementById('github-text').innerHTML = 
    langContent.github.replace(': ', ': <a href="https://www.github.com/Mre25" target="_blank">') + '</a>';

  updateSkillsList();
  updateCoursesList();
}

function openProjectsGallery() {
  document.getElementById('projects-gallery').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeProjectsGallery() {
  document.getElementById('projects-gallery').style.display = 'none';
  document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof lightbox !== 'undefined') {
    lightbox.option({
      'resizeDuration': 200,
      'wrapAround': true,
      'showImageNumberLabel': false,
      'alwaysShowNavOnTouchDevices': true,
      'albumLabel': 'Project %1 of %2'
    });
  }

  setLanguage('en');

  document.addEventListener('click', function(event) {
    const gallery = document.getElementById('projects-gallery');
    if (event.target === gallery) {
      closeProjectsGallery();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeProjectsGallery();
    }
  });
});`;
        }
        
        // تحديث ملف على GitHub
        async function updateFileOnGitHub(filename, content) {
            const url = `https://api.github.com/repos/${githubUser}/portfolio/contents/${filename}`;
            
            // الحصول على SHA الحالي
            let sha = '';
            try {
                const getResponse = await fetch(url, {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // الملف غير موجود، سننشئه
            }
            
            // رفع الملف
            const updateResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update ${filename} via CMS`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: sha || undefined
                })
            });
            
            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.message || 'Failed to update file');
            }
            
            return true;
        }
        
        // دالة عرض التبويب
        function showTab(tabName) {
            // إخفاء كل التبويبات
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // عرض التبويب المحدد
            document.getElementById('tab-' + tabName).classList.add('active');
            
            // تحديث الزر النشط
            const buttons = document.querySelectorAll('.tab-btn');
            const tabMap = {
                'personal': 0,
                'about': 1,
                'skills': 2,
                'courses': 3,
                'projects': 4,
                'save': 5
            };
            if (tabMap[tabName] !== undefined) {
                buttons[tabMap[tabName]].classList.add('active');
            }
            
            // تحديث الملخص عند الذهاب لتبويب الحفظ
            if (tabName === 'save') {
                updateSummary();
            }
        }
        
        // دوال الإشعارات والتحميل
        function showNotification(message, type = 'info') {
            const notif = document.getElementById('notification');
            const text = document.getElementById('notifText');
            
            notif.className = 'notification ' + type;
            text.textContent = message;
            
            setTimeout(() => {
                notif.className = 'notification';
            }, 4000);
        }
        
        function showLoading(show) {
            document.getElementById('loading').classList.toggle('active', show);
        }
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', function(e) {
            // Ctrl+S = حفظ
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (isLoggedIn) {
                    saveToGitHub();
                }
            }
            
            // Ctrl+P = معاينة
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                if (isLoggedIn) {
                    previewData();
                }
            }
        });
        
        // تحميل البيانات عند فتح الصفحة
        document.addEventListener('DOMContentLoaded', function() {
            // التحقق من وجود توكن مخزن
            const savedToken = localStorage.getItem('githubToken');
            const savedUser = localStorage.getItem('githubUser');
            
            if (savedToken && savedUser) {
                document.getElementById('githubToken').value = savedToken;
                document.getElementById('githubUser').value = savedUser;
                // يمكنك تفعيل تسجيل الدخول التلقائي إذا أردت
            }
        });
    </script>
</body>
</html>