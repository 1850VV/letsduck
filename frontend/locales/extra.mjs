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
