import { CardSineLineContainer } from '@/components/card-singleline-container';
import { EmptyCardType } from '@/components/empty/constant';
import { EmptyAppCard } from '@/components/empty/empty';
import { HomeIcon } from '@/components/svg-icon';
import { Segmented, SegmentedValue } from '@/components/ui/segmented';
import { Routes } from '@/routes';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { SeeAllAppCard } from './application-card';
import { ChatList } from './chat-list';
import { SearchList } from './search-list';

const IconMap = {
  [Routes.Chats]: 'chats',
  [Routes.Searches]: 'searches',
};

const EmptyTypeMap = {
  [Routes.Chats]: EmptyCardType.Chat,
  [Routes.Searches]: EmptyCardType.Search,
};

export function Applications() {
  const [val, setVal] = useState(Routes.Chats);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [listLength, setListLength] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleNavigate = useCallback(
    ({ isCreate }: { isCreate?: boolean }) => {
      if (isCreate) {
        navigate(val + '?isCreate=true');
      } else {
        navigate(val);
      }
    },
    [navigate, val],
  );

  const options = useMemo(
    () => [
      { value: Routes.Chats, label: t('chat.chatApps') },
      { value: Routes.Searches, label: t('search.searchApps') },
    ],
    [t],
  );

  const handleChange = (path: SegmentedValue) => {
    setVal(path as Routes);
    setListLength(0);
    setLoading(true);
  };

  return (
    <section className="mt-10">
      <div className="bg-bg-card border border-border-default/80 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="text-xl font-semibold flex gap-2.5 items-center">
            <HomeIcon
              name={`${IconMap[val as keyof typeof IconMap]}`}
              width={'28'}
            />
            {options.find((x) => x.value === val)?.label}
          </h2>
          <Segmented
            options={options}
            value={val}
            onChange={handleChange}
            buttonSize="lg"
            className="bg-bg-base/50 rounded-full"
            activeClassName="text-bg-base bg-metallic-gradient border-none shadow-sm"
          ></Segmented>
        </div>
        <CardSineLineContainer>
          {val === Routes.Chats && (
            <ChatList
              setListLength={(length: number) => setListLength(length)}
              setLoading={(loading: boolean) => setLoading(loading)}
            ></ChatList>
          )}
          {val === Routes.Searches && (
            <SearchList
              setListLength={(length: number) => setListLength(length)}
              setLoading={(loading: boolean) => setLoading(loading)}
            ></SearchList>
          )}
          {listLength > 0 && (
            <SeeAllAppCard
              click={() => handleNavigate({ isCreate: false })}
            ></SeeAllAppCard>
          )}
        </CardSineLineContainer>
        {listLength <= 0 && !loading && (
          <EmptyAppCard
            type={EmptyTypeMap[val as keyof typeof EmptyTypeMap]}
            onClick={() => handleNavigate({ isCreate: true })}
          />
        )}
      </div>
    </section>
  );
}
