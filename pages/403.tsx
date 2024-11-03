import type { ReactElement } from 'react'
import { useRouter } from 'next/router';
import Style from "../styles/NotFound.module.css";

export default function Custom403() {
  const router = useRouter()
  return (<>
    <div>
      <div className={Style.wrapper}>
        <h1 className={Style.title}>
          403
        </h1>
        <div className={Style.descWrapper}>
          <h2 className={Style.desc}>Forbidden Page.<a onClick={() => router.back()}> Go Back</a></h2>
        </div>
      </div>
    </div>
  </>)
}

Custom403.getLayout = function getLayout(page: ReactElement) {
    return (
        <>{page}</>
    )
}