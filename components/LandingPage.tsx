import { LoginBox, TopBarDark } from '@/components'

export default async function LandingPage () {
  return (
    <>
      <div className="app__landingpage">
        <TopBarDark isGuest={true}/>
        <div className='bg-gray-700 h-screen pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center'>
            <LoginBox/>
        </div>
        <div className='bg-gray-800 p-4'>
          <div className='text-white text-center text-xs'>version v2.2.0</div>
        </div>
      </div>
    </>
  )
}
