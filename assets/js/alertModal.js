import {
  alertBtns,
  alertCancelBtn,
  alertMessageEl,
  alertModal,
  alertNoBtn,
  alertOkBtn,
  alertTitleEl,
} from "./ui.js";

export const ALERT_ACCEPT = 0;
export const ALERT_REJECT = 1;
export const ALERT_CANCEL = 2;

export const showAlert = (title, message, options = {}) => {
  return new Promise((resolve) => {
    let {
      position = "center",
      alertDuration = null,
      cancelBtn = false,
    } = options;

    alertTitleEl.textContent = title;
    alertMessageEl.textContent = message;

    const lowerTitle = title.toLowerCase();
    alertModal.className = `alert-overlay ${position} ${lowerTitle}`;
    alertModal.style.display = "flex";
    alertCancelBtn.className = `alert-cancel-btn btn btn-primary ${
      cancelBtn ? "active" : null
    }`;

    if (alertDuration === null) {
      alertBtns.className = "alert-btns active";
      alertModal.focus();
      setTimeout(() => {
        alertCancelBtn.focus();
      }, 300);
    } else {
      alertModal.className = `alert-overlay bottom quick ${lowerTitle}`;
      alertBtns.className = "alert-btns";
    }

    let timer;

    if (alertDuration !== null) {
      timer = setInterval(() => {
        alertDuration--;

        if (alertDuration <= 0) {
          clearInterval(timer);
          close();
        }
      }, 1000);
    } else {
      alertOkBtn.textContent = `OK`;
    }

    let focusTrapHandler = null;

    function enableFocusTrap() {
      const focusableElements = alertModal.querySelectorAll(
        'button:not([style*="display: none"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const visibleElements = Array.from(focusableElements).filter((el) => {
        return el.offsetParent !== null;
      });

      const firstElement = visibleElements[0];
      const lastElement = visibleElements[visibleElements.length - 1];

      focusTrapHandler = function (e) {
        if (e.key === "Tab") {
          if (visibleElements.length === 1) {
            e.preventDefault();
            return;
          }

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "a") {
          e.preventDefault();
          e.stopPropagation();

          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(alert);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        if (e.key === "Escape" && alertDuration === null) {
          if (timer) clearInterval(timer);
          close(2);
        }
      };

      document.addEventListener("keydown", focusTrapHandler);
    }

    function disableFocusTrap() {
      if (focusTrapHandler) {
        document.removeEventListener("keydown", focusTrapHandler);
        focusTrapHandler = null;
      }
    }

    enableFocusTrap();

    function close(accept = ALERT_REJECT) {
      alertModal.style.display = "none";
      disableFocusTrap();
      resolve(accept);
    }

    alertCancelBtn.onclick = () => {
      if (timer) clearInterval(timer);
      close(ALERT_CANCEL);
    };

    alertNoBtn.onclick = () => {
      if (timer) clearInterval(timer);
      close(ALERT_REJECT);
    };

    alertOkBtn.onclick = () => {
      if (timer) clearInterval(timer);
      close(ALERT_ACCEPT);
    };
  });
};
