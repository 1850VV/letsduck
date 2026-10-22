// Native form messages must follow the application's selected language too.
const rows={
 'zh-Hans':['请填写此字段。','请至少输入 {count} 个字符。','请检查此字段的内容。'],
 'zh-Hant':['請填寫此欄位。','請至少輸入 {count} 個字元。','請檢查此欄位的內容。'],
 en:['Please fill out this field.','Use at least {count} characters.','Please check this value.'],
 ja:['この項目を入力してください。','{count} 文字以上入力してください。','入力内容を確認してください。'],
 ko:['이 항목을 입력해 주세요.','{count}자 이상 입력해 주세요.','입력한 내용을 확인해 주세요.'],
 fr:['Ce champ est obligatoire.','Utilisez au moins {count} caractères.','Vérifiez cette valeur.'],
 de:['Bitte fülle dieses Feld aus.','Verwende mindestens {count} Zeichen.','Bitte prüfe diesen Wert.'],
 es:['Completa este campo.','Usa al menos {count} caracteres.','Revisa este valor.'],
 'pt-BR':['Preencha este campo.','Use pelo menos {count} caracteres.','Confira este valor.'],
 ru:['Заполните это поле.','Введите не менее {count} символов.','Проверьте это значение.'],
 ar:['يرجى ملء هذا الحقل.','استخدم {count} أحرف على الأقل.','يرجى التحقق من هذه القيمة.'],
 hi:['कृपया यह फ़ील्ड भरें।','कम से कम {count} अक्षर लिखें।','कृपया यह मान जाँचें।']
};
export const extra=Object.fromEntries(Object.entries(rows).map(([code,[required,minlength,invalid]])=>[code,{'form.required':required,'form.minlength':minlength,'form.invalid':invalid}]));
const serverMessages={
 'zh-Hans':['导出任务较多，请稍后重试','分页范围不对'],
 'zh-Hant':['匯出工作較多，請稍後重試','分頁範圍不正確'],
 en:['The export queue is busy. Please try again shortly.','The page range is invalid.'],
 ja:['エクスポートが混み合っています。しばらくしてから再試行してください。','ページの範囲が正しくありません。'],
 ko:['내보내기 요청이 많습니다. 잠시 후 다시 시도해 주세요.','페이지 범위가 올바르지 않습니다.'],
 fr:['La file d’exportation est occupée. Réessayez dans un instant.','La plage de pages est incorrecte.'],
 de:['Die Exportwarteschlange ist ausgelastet. Bitte versuche es gleich erneut.','Der Seitenbereich ist ungültig.'],
 es:['La cola de exportación está ocupada. Inténtalo de nuevo en un momento.','El intervalo de páginas no es válido.'],
 'pt-BR':['A fila de exportação está ocupada. Tente novamente em instantes.','O intervalo de páginas é inválido.'],
 ru:['Очередь экспорта занята. Повторите попытку немного позже.','Неверный диапазон страниц.'],
 ar:['قائمة انتظار التصدير مشغولة. حاول مرة أخرى بعد قليل.','نطاق الصفحات غير صالح.'],
 hi:['निर्यात की कतार व्यस्त है। थोड़ी देर बाद फिर कोशिश करें।','पृष्ठों की सीमा अमान्य है।']
};
for(const [code,[busy,pagination]]of Object.entries(serverMessages))Object.assign(extra[code],{'error.export.busy':busy,'error.request.pagination':pagination});
