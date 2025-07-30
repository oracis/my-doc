import './Loader.css';

const Loader = ({ isLoading, text = '处理中' }) => {
  console.log('isLoading', isLoading);
  return (
    isLoading && (
      <div className='loading-component text-center'>
        <div className='spinner-grow text-primary' role='status'>
          <span className='sr-only'>{text}</span>
        </div>
        <h5 className='text-primary'>{text}</h5>
      </div>
    )
  );
};

export default Loader;
