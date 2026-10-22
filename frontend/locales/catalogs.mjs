// Reviewed source strings are keyed independently of user-provided data.
const values={
 'zh-Hans':['保存','已保存「{name}」'], 'zh-Hant':['儲存','已儲存「{name}」'], en:['Save','Saved “{name}”'],
 ja:['保存','「{name}」を保存しました'],ko:['저장','「{name}」 저장됨'],fr:['Enregistrer','« {name} » enregistré'],de:['Speichern','„{name}“ gespeichert'],es:['Guardar','«{name}» guardado'],'pt-BR':['Salvar','“{name}” salvo'],ru:['Сохранить','«{name}» сохранено'],ar:['حفظ','تم حفظ «{name}»'],hi:['सहेजें','“{name}” सहेजा गया']
};
export const catalogs=Object.fromEntries(Object.entries(values).map(([code,[save,saved]])=>[code,{'common.save':save,'common.saved':saved}]));
