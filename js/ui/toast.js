/* ══════════════════════════════════════════════════════════
   RavenFit — toast.js
   Bildirim ve onay diyalogları
   ══════════════════════════════════════════════════════════ */

function showToast(msg,type){var t=document.getElementById('rf-toast');if(!t)return;t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';clearTimeout(t._tid);t._tid=setTimeout(function(){t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)';},2500);}

function showConfirm(title,body,cb,okLabel,cancelCb,cancelLabel){_rfConfirmCb=cb||null;_rfConfirmCancelCb=cancelCb||null;document.getElementById('rf-confirm-title').textContent=title||'Emin misin?';document.getElementById('rf-confirm-body').innerHTML=body||'';document.getElementById('rf-confirm-ok').textContent=okLabel||'Evet';var cnEl=document.getElementById('rf-confirm-cancel');if(cnEl)cnEl.textContent=cancelLabel||'İptal';document.getElementById('rf-confirm-overlay').classList.add('active');}

function rfConfirmOk(){document.getElementById('rf-confirm-overlay').classList.remove('active');var cb=_rfConfirmCb;_rfConfirmCb=null;_rfConfirmCancelCb=null;if(typeof cb==='function')cb();}

function rfConfirmCancel(){document.getElementById('rf-confirm-overlay').classList.remove('active');var cb=_rfConfirmCancelCb;_rfConfirmCb=null;_rfConfirmCancelCb=null;if(typeof cb==='function')cb();}
