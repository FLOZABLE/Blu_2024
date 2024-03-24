import React, { useState, useEffect, useRef, useContext } from 'react';
import styles from './Analysis.module.css';
import { updateTimeUsagePie, updateRankingTrend, updateSubjectsTrendChart } from './AnalysisTools';
import { DateTime } from 'luxon';
import { PieChart, Pie, Tooltip, ResponsiveContainer, YAxis, XAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { Link } from 'react-router-dom';
import { UserInfoContext, WorkoutsContext } from '../../../Contexts';
import { IconBook, IconEyeOutline, IconStatsChart }  from '../../../utils/Svgs';
import { coldColorsList } from '../../../utils/Constants';
import RadioBtn from '../../UI/Buttons/RadioBtn/RadioBtn';
import DateSelectorBtn from '../../UI/Buttons/DateSelectorBtn/DateSelectorBtn';
import { PieCustomTooltip, pieCustomLabel } from '../../UI/Charts/Charts';
import StudyTrendChart from '../../UI/Charts/StudyTrendChart';
import { secondConverter } from '../../../utils/Tools';
import CalendarModal from '../../UI/Modals/CalendarModal/CalendarModal';

const serverOrigin = process.env.REACT_APP_ORIGIN;
let rankingTrend = [];

function Analysis({ 
}) {
  const {workouts} = useContext(WorkoutsContext);
  const {userInfo} = useContext(UserInfoContext);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [statsViewer, setStatsViewer] = useState('Daily');
  const [viewDate, setViewDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [totalStudy, setTotalStudy] = useState("");
  const [focus, setFocus] = useState("");
  const [ranking, setRanking] = useState(0);
  const [websites, setWebsites] = useState([]);
  const [websitesUsage, setWebsitesUsage] = useState(0);
  const [websitesVisit, setWebsitesVisit] = useState(0);
  const [rankingsTrend, setRankingsTrend] = useState([]);

  const updateViewer = async (item) => {
    setStatsViewer(item);
  };

  const updateViewDate = (date) => {
    setViewDate(date);
  };

  useEffect(() => {
    if (!userInfo) return;
    const { user_id } = userInfo;
    const viewDateTime = DateTime.fromJSDate(viewDate);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(`${serverOrigin}/extension/usage?date=${viewDateTime.toISODate()}&mode=${statsViewer}&timezone=${timezone}`,
      {
        method: "get",
      })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setTimeout(() => {
            setWebsites(response.websitesData);
          }, 1300);

          let websitesUsage = 0;
          let websitesVisit = 0;
          response.websitesData.map(website => {
            websitesUsage += website.t;
            websitesVisit += website.v;
          });
          const websitesUsagesDisp = secondConverter(websitesUsage);
          setWebsitesUsage(`${websitesUsagesDisp.value} ${websitesUsagesDisp.type}`);
          setWebsitesVisit(`${websitesVisit} times`);
        }
      })
      .catch((error) => console.error(error));

    fetch(`${serverOrigin}/ranking/user?userId=${user_id}&mode=${statsViewer.toLowerCase()}&date=${viewDateTime.toISODate()}&timezone=${timezone}`, {
      method: 'get'
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log(data)
          rankingTrend = updateRankingTrend(data.rankings, statsViewer);
          let ranking = 0;
          if (statsViewer === "Daily") {
            ranking = rankingTrend.find(ranking => ranking.label === viewDateTime.toISODate());
          } else if (statsViewer === "Weekly") {
            ranking = rankingTrend.find(ranking => ranking.label === viewDateTime.startOf('week').toISODate());
          } else {
            ranking = rankingTrend.find(ranking => ranking.label === viewDateTime.startOf('month').toISODate());
          };

          if (ranking) {
            setRanking(ranking.data);
          }

          setTimeout(() => {
            setRankingsTrend(rankingTrend);
          }, 0);
        }
      })
      .catch((error) => console.error(error));


  }, [userInfo, viewDate, statsViewer]);

  const focusCalculator = (grouped) => {
    if (!grouped) return 0;
    let focus = 0;
    grouped.map(([start, stop]) => {
      const duration = stop - start;
      if (duration > focus) {
        focus = duration;
      };
      return null;
    });
    return focus;
  };

  const [subjectsPie, setSubjectsPie] = useState([]);

  const [subjectsTrend, setSubjectsTrend] = useState([]);
  const [filteredTrends, setFilteredTrends] = useState([]);

  useEffect(() => {
    if (!viewDate || !statsViewer || !workouts) return;

    const { daily, weekly, monthly } = workouts;

    if (!daily) return;

    const now = DateTime.now().startOf('day');
    const viewDateTime = DateTime.fromJSDate(viewDate);
    //subject time usage pie chart
    const subjectsPie = updateTimeUsagePie(workouts, viewDateTime, statsViewer);
    setTimeout(() => {
      setSubjectsPie(subjectsPie.reduce((accumulator, data, i) => {
        const value = data.value;
        if (value) {
          const name = data.info.name;
          const fill = coldColorsList[accumulator.length % (coldColorsList.length)];
          const labelVal = secondConverter(value);
          accumulator.push({ value, name, fill, labelVal: `${labelVal.value} ${labelVal.type}` });
        }
        return accumulator;
      }, []));
    }, 310);

    if (statsViewer === 'Daily') {

      //top box renderer
      const index = viewDateTime.diff(now, 'days').toObject();
      const { groupedTotal, grouped } = daily;
      const actualIndex = grouped.length + index.days - 1;
      const totalStudyDisp = secondConverter(groupedTotal[actualIndex]);
      setTotalStudy(`${totalStudyDisp.value}${totalStudyDisp.type}`);
      const focus = focusCalculator(grouped[actualIndex]);
      const { value, type } = secondConverter(focus);
      setFocus(`${value}${type}`);

      //subject trend data handler
      const subjectsTrend = updateSubjectsTrendChart(workouts, viewDate, statsViewer, 'days');
      setTimeout(() => {
        setSubjectsTrend(subjectsTrend);
      }, 310);
    } else if (statsViewer === 'Weekly') {

      //top box renderer
      const index = viewDateTime.startOf('week').diff(DateTime.now().startOf('week'), 'weeks').toObject();
      const { groupedTotal, grouped } = weekly;
      const actualIndex = grouped.length + index.weeks - 1;
      const totalStudyDisp = secondConverter(groupedTotal[actualIndex]);
      setTotalStudy(`${totalStudyDisp.value}${totalStudyDisp.type}`);
      const focus = focusCalculator(grouped[actualIndex]);
      const { value, type } = secondConverter(focus);
      setFocus(`${value}${type}`);

      //subject trend data handler
      const subjectsTrend = updateSubjectsTrendChart(workouts, viewDate, statsViewer, 'weeks');
      setTimeout(() => {
        setSubjectsTrend(subjectsTrend);
      }, 310);
      //setSubjectsTrend(subjectsTrend);
    } else {

      //top box renderer
      const index = viewDateTime.startOf('month').diff(DateTime.now().startOf('month'), 'months').toObject();
      const { groupedTotal, grouped } = monthly;
      const actualIndex = grouped.length + index.months - 1;
      const totalStudyDisp = secondConverter(groupedTotal[actualIndex]);
      setTotalStudy(`${totalStudyDisp.value}${totalStudyDisp.type}`);
      const focus = focusCalculator(grouped[actualIndex]);
      const { value, type } = secondConverter(focus);
      setFocus(`${value}${type}`);

      //subject trend data handler
      const subjectsTrend = updateSubjectsTrendChart(workouts, viewDate, statsViewer, 'months');
      setTimeout(() => {
        setSubjectsTrend(subjectsTrend);
      }, 310);
    }
  }, [viewDate, statsViewer, workouts]);

  return (
    <div>
      <CalendarModal isCalendarOpen={isCalendarOpen} setIsCalendarOpen={setIsCalendarOpen} updateViewDate={updateViewDate} viewDate={viewDate} workouts={workouts} showHeatmap={true} />
      <div className="Main">
        <div className="title">
          Stats
        </div>
        <div className={styles.Analysis}>
        <div className={styles.optionsHeader}>
          <div className={styles.dateSelectorWrapper}>
            <DateSelectorBtn viewMode={statsViewer} className={styles.title} viewDate={viewDate} isCalendarOpen={isCalendarOpen} setIsCalendarOpen={setIsCalendarOpen}></DateSelectorBtn>
          </div>
          <RadioBtn items={[{ view: 'Daily', value: 'Daily' }, { view: 'Weekly', value: 'Weekly' }, { view: 'Monthly', value: 'Monthly' }]} changeEvent={updateViewer} defaultViewer={0} />
        </div>
        <div>
          <div className={styles.bigBox}>
            <div className={styles.contents}>
              <div className={styles.chartWrapper}>
                {subjectsPie.length
                  ?
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<PieCustomTooltip />} />
                      <Pie
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        data={subjectsPie}
                        dataKey={"value"}
                        outerRadius={"100%"}
                        innerRadius={"75%"}
                        fill="green"
                        label={pieCustomLabel}
                      >
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  :
                  <Link
                    to="/dashboard/study"
                    className={styles.noChart}>
                    <h3>Study to see stats!</h3>
                  </Link>
                }
              </div>
              <div>
                <div className={styles.overflow}>
                  <i>
                    <IconBook />
                  </i>
                  Total Study Time {totalStudy}
                </div>
                <div className={styles.overflow}>
                  <i>
                  </i>
                  Website Usage Time {websitesUsage} / {websitesVisit} times
                </div>
                <div className={styles.overflow}>
                  <i>
                    <IconStatsChart />
                  </i>
                  Ranking {ranking}
                </div>
                <div className={styles.overflow}>
                  <i>
                    <IconEyeOutline />
                  </i>
                  Focus {focus}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.bigBox}>
            <h3>Study Time Trend</h3>
            <div className={styles.contents}>
              <div className={styles.chartWrapper}>
                <StudyTrendChart
                  subjectsTrend={subjectsTrend}
                />
              </div>
            </div>
          </div>
          <div className={styles.bigBox}>
            <h3>Ranking Trend</h3>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rankingsTrend}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickFormatter={(data) => {
                    const dateTime = DateTime.fromISO(data);

                    return dateTime.toFormat('M/d');
                  }} />
                  <YAxis reversed={true} />
                  <Tooltip />
                  <Line type="monotone" dataKey={"ranking"} stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Analysis;