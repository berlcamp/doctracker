const Title = ({ title }: { title: string }) => {
  return (
    <div className='flex-1 text-2xl text-gray-700 text-left dark:text-gray-300'>
      { title }
    </div>
  )
}

export default Title
