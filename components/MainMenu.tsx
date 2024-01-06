'use client'
import { superAdmins } from '@/constants/TrackerConstants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Cog6ToothIcon, DocumentDuplicateIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

const MainMenu: React.FC = () => {
  const { hasAccess } = useFilter()
  const { session } = useSupabase()

  return (
    <div className="py-1">
      <div className='px-4 py-4'>
        <div className='text-gray-700 text-xl font-semibold'>Menu</div>
        <div className='lg:flex space-x-2'>
          <div className='px-2 py-4 mt-2 lg:w-96 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col space-y-2'>
            {
              (hasAccess('document_tracker')) &&
                <Link href='/tracker'>
                  <div className='app__menu_item'>
                    <div className='pt-1'>
                      <DocumentDuplicateIcon className='w-8 h-8'/>
                    </div>
                    <div>
                      <div className='app__menu_item_label'>Document Tracker</div>
                      <div className='app__menu_item_label_description'>Letters, Leave requests, travel authorities, etc.</div>
                    </div>
                  </div>
                </Link>
            }
            {
              superAdmins.includes(session.user.email) &&
                <>
                  <Link href='/settings/system'>
                  <div className='app__menu_item'>
                    <div className='pt-1'>
                      <Cog6ToothIcon className='w-8 h-8'/>
                    </div>
                    <div>
                      <div className='app__menu_item_label'>System Settings</div>
                      <div className='app__menu_item_label_description'>System Settings - Berl Only</div>
                    </div>
                  </div>
                </Link>
              </>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
export default MainMenu
