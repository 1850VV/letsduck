// Progress keys contain the complete tutorial identity. Store each shared prefix once.
export function encodeJournal(journal){
 const prefixes=[],writes=journal.writes.map(({key,before,after})=>{
  const at=key.lastIndexOf(':')+1,prefix=key.slice(0,at),suffix=key.slice(at);
  let index=prefixes.indexOf(prefix);if(index<0){index=prefixes.length;prefixes.push(prefix);}
  return [index,suffix,before,after];
 });
 return JSON.stringify({...journal,encoding:2,prefixes,writes});
}
export function decodeJournal(raw){
 const journal=JSON.parse(raw);
 if(journal.encoding===2)journal.writes=journal.writes.map(([index,suffix,before,after])=>({key:journal.prefixes[index]+suffix,before,after}));
 return journal;
}
