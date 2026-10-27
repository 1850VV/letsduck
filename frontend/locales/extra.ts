// Native form messages must follow the application's selected language too.
const rows: Record<string, [string, string, string]>={
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
export const extra: Record<string, Record<string, string>>=Object.fromEntries(Object.entries(rows).map(([code,[required,minlength,invalid]])=>[code,{'form.required':required,'form.minlength':minlength,'form.invalid':invalid}]));
const serverMessages: Record<string, [string, string]>={
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
for(const [code,[busy,pagination]]of Object.entries(serverMessages))Object.assign(extra[code]!,{'error.export.busy':busy,'error.request.pagination':pagination});
const filamentLabels: Record<string, [string, string, string, string, string]>={
 'zh-Hans':['系列','搜索颜色、色号或 SKU','{count} 条配色 · 厂商官方色值','厂商 ↗','硬质部件'],
 'zh-Hant':['系列','搜尋顏色、色號或 SKU','{count} 條配色 · 廠商官方色值','廠商 ↗','硬質零件'],
 en:['Series','Search colour, code or SKU','{count} colours · official manufacturer values','Manufacturer ↗','Rigid parts'],
 ja:['シリーズ','色・色番号・SKU を検索','{count} 色 · メーカー公式値','メーカー ↗','硬質パーツ'],
 ko:['시리즈','색상, 색상 코드 또는 SKU 검색','{count}개 색상 · 제조사 공식 색상값','제조사 ↗','경질 부품'],
 fr:['Gamme','Chercher couleur, code ou SKU','{count} couleurs · valeurs officielles','Fabricant ↗','Pièces rigides'],
 de:['Serie','Farbe, Farbcode oder SKU suchen','{count} Farben · offizielle Herstellerwerte','Hersteller ↗','Starre Teile'],
 es:['Serie','Buscar color, código o SKU','{count} colores · valores oficiales','Fabricante ↗','Piezas rígidas'],
 'pt-BR':['Série','Buscar cor, código ou SKU','{count} cores · valores oficiais','Fabricante ↗','Peças rígidas'],
 ru:['Серия','Поиск цвета, кода или SKU','{count} цветов · данные производителя','Производитель ↗','Жёсткие детали'],
 ar:['السلسلة','البحث باللون أو الرمز أو SKU','{count} لون · قيم الشركة الرسمية','الشركة ↗','قطع صلبة'],
 hi:['सीरीज़','रंग, कोड या SKU खोजें','{count} रंग · निर्माता के आधिकारिक मान','निर्माता ↗','कठोर भाग']
};
for(const [locale,labels]of Object.entries(filamentLabels))Object.assign(extra[locale]!,Object.fromEntries(['series','search','colours','source','rigid'].map((key,i)=>['filament.'+key,labels[i]!])));
const filamentExportLabels: Record<string, [string, string, string]>={
 'zh-Hans':['耗材编号','多色色值','打印预设'],'zh-Hant':['耗材編號','多色色值','列印預設'],en:['Product ID','All colour values','Print preset'],ja:['製品 ID','すべての色値','印刷プリセット'],ko:['제품 ID','전체 색상값','출력 프리셋'],fr:['Identifiant produit','Toutes les couleurs','Préréglage'],de:['Produkt-ID','Alle Farbwerte','Druckprofil'],es:['ID de producto','Todos los colores','Perfil de impresión'],'pt-BR':['ID do produto','Todas as cores','Perfil de impressão'],ru:['ID материала','Все значения цветов','Профиль печати'],ar:['معرف المنتج','جميع قيم الألوان','إعداد الطباعة'],hi:['उत्पाद ID','सभी रंग मान','प्रिंट प्रीसेट']
};
for(const [locale,labels]of Object.entries(filamentExportLabels))Object.assign(extra[locale]!,Object.fromEntries(['productId','multiColours','profile'].map((key,i)=>['filament.'+key,labels[i]!])));
const filamentSlot: Record<string, string>={
 'zh-Hans':'{code} · {count} 个零件 · 槽 {slot}','zh-Hant':'{code} · {count} 個零件 · 槽 {slot}',en:'{code} · {count} parts · slot {slot}',ja:'{code} · {count} パーツ · スロット {slot}',ko:'{code} · 부품 {count}개 · 슬롯 {slot}',fr:'{code} · {count} pièces · emplacement {slot}',de:'{code} · {count} Teile · Slot {slot}',es:'{code} · {count} piezas · ranura {slot}','pt-BR':'{code} · {count} peças · posição {slot}',ru:'{code} · {count} деталей · слот {slot}',ar:'{code} · {count} قطع · خانة {slot}',hi:'{code} · {count} भाग · स्लॉट {slot}'
};
for(const [locale,label]of Object.entries(filamentSlot))extra[locale]!['filament.slot']=label;
