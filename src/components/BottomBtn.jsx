import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => {
  return (
    <button
      type='button'
      className={`btn btn-block no-border ${colorClass}`}
      onClick={onBtnClick}
    >
      <FontAwesomeIcon icon={icon} size='lg' className='mr-2' />
      {text}
    </button>
  );
};

export default BottomBtn;
