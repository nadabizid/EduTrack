import { useState, useCallback, useRef } from 'react';
let _show = null;
export const toast = (msg, type='success') => _show?.(msg,type);

export function ToastProvider({ children }) {
  const [t,setT] = useState({msg:'',type:'success',show:false});
  const timer = useRef(null);
  _show = useCallback((msg,type='success') => {
    if(timer.current) clearTimeout(timer.current);
    setT({msg,type,show:true});
    timer.current = setTimeout(()=>setT(x=>({...x,show:false})),3000);
  },[]);
  return (
    <>
      {children}
      <div className={`toast${t.show?' show':''} ${t.type}`}>
        {t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'} {t.msg}
      </div>
    </>
  );
}
