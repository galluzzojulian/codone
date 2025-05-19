import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  }
};

export function initMonaco() {
  // Initialize Monaco features here if needed
  
  // Add HTML completion providers with Webflow-specific suggestions
  monaco.languages.registerCompletionItemProvider('html', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          // Basic HTML elements
          {
            label: 'div',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<div>$1</div>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Basic div element'
          },
          {
            label: 'script',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<script>\n\t$1\n</script>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Script tag'
          },
          
          // Webflow-specific HTML snippets
          {
            label: 'wf-section',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<div class="section wf-section">\n\t$1\n</div>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Webflow section div'
          },
          {
            label: 'wf-container',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<div class="container">\n\t$1\n</div>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Webflow container'
          },
          {
            label: 'jQuery',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>',
            range,
            detail: 'Include jQuery library'
          },
          {
            label: 'gsap',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.3/gsap.min.js"></script>',
            range,
            detail: 'Include GSAP animation library'
          },
          {
            label: 'webflow-data-attr',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'data-wf-$1="$2"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Webflow data attribute'
          },
          {
            label: 'responsive-img',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<img src="$1" loading="lazy" alt="$2" class="image">',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Responsive image with lazy loading'
          }
        ]
      };
    }
  });

  // Add CSS completion providers with Webflow-friendly styles
  monaco.languages.registerCompletionItemProvider('css', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          // Basic CSS properties
          {
            label: 'display-flex',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: flex;',
            range,
            detail: 'Flexbox layout'
          },
          {
            label: 'grid',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: grid;\ngrid-template-columns: $1;',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'CSS Grid layout'
          },
          
          // Webflow-specific CSS snippets
          {
            label: 'wf-breakpoint-mobile',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '@media screen and (max-width: 479px) {\n\t$1\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Webflow mobile breakpoint'
          },
          {
            label: 'wf-breakpoint-tablet',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '@media screen and (max-width: 767px) {\n\t$1\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Webflow tablet breakpoint'
          },
          {
            label: 'wf-animation',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'transition: all 0.3s ease;',
            range,
            detail: 'Smooth transition animation'
          },
          {
            label: 'wf-cms-item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '.w-dyn-item {\n\t$1\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Webflow CMS item styling'
          },
          {
            label: 'responsive-image',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'width: 100%;\nheight: auto;\nobject-fit: cover;',
            range,
            detail: 'Responsive image styling'
          }
        ]
      };
    }
  });

  // Add JavaScript completion providers with Webflow-friendly scripts
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      return {
        suggestions: [
          // Basic JS snippets
          {
            label: 'func',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Function declaration'
          },
          {
            label: 'cl',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'console.log($1);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Console log'
          },
          
          // Webflow-specific JS snippets
          {
            label: 'wf-ready',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'document.addEventListener("DOMContentLoaded", function() {\n\t$1\n});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Document ready event'
          },
          {
            label: 'wf-jquery-ready',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '$(document).ready(function() {\n\t$1\n});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'jQuery document ready'
          },
          {
            label: 'wf-slider',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const slider = document.querySelector("$1");\nlet isDown = false;\nlet startX;\nlet scrollLeft;\n\nslider.addEventListener("mousedown", (e) => {\n\tisDown = true;\n\tslider.classList.add("active");\n\tstartX = e.pageX - slider.offsetLeft;\n\tscrollLeft = slider.scrollLeft;\n});\n\nslider.addEventListener("mouseleave", () => {\n\tisDown = false;\n\tslider.classList.remove("active");\n});\n\nslider.addEventListener("mouseup", () => {\n\tisDown = false;\n\tslider.classList.remove("active");\n});\n\nslider.addEventListener("mousemove", (e) => {\n\tif (!isDown) return;\n\te.preventDefault();\n\tconst x = e.pageX - slider.offsetLeft;\n\tconst walk = (x - startX) * 2;\n\tslider.scrollLeft = scrollLeft - walk;\n});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Custom drag slider implementation'
          },
          {
            label: 'wf-animate-on-scroll',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const observer = new IntersectionObserver((entries) => {\n\tentries.forEach((entry) => {\n\t\tif (entry.isIntersecting) {\n\t\t\tentry.target.classList.add("animate");\n\t\t}\n\t});\n});\n\ndocument.querySelectorAll("$1").forEach((el) => {\n\tobserver.observe(el);\n});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Animate elements on scroll'
          },
          {
            label: 'wf-cms-filter',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'const filterButtons = document.querySelectorAll("$1");\nconst items = document.querySelectorAll("$2");\n\nfilterButtons.forEach((button) => {\n\tbutton.addEventListener("click", () => {\n\t\tconst filterValue = button.getAttribute("data-filter");\n\t\t\n\t\t// Update active state\n\t\tfilterButtons.forEach(btn => btn.classList.remove("active"));\n\t\tbutton.classList.add("active");\n\t\t\n\t\t// Filter items\n\t\titems.forEach((item) => {\n\t\t\tif (filterValue === "all" || item.classList.contains(filterValue)) {\n\t\t\t\titem.style.display = "block";\n\t\t\t} else {\n\t\t\t\titem.style.display = "none";\n\t\t\t}\n\t\t});\n\t});\n});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Filter CMS items'
          }
        ]
      };
    }
  });
} 