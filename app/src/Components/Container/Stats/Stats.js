import React, { useState, useEffect, useRef } from 'react';
import RadioBtn from '../../UI/RadioBtn/RadioBtn';
import { coldColorsList, colorsList, warmColorsList } from '../../../constant';
import styles from './Stats.module.css';
import { updateTimeUsagePie, updateRankingTrend, updateSubjectsTrendChart } from './StatTools';
import DateSelectorBtn from '../../UI/DateSelectorBtn/DateSelectorBtn';
import { DateTime } from 'luxon';
import CalendarModal from '../../UI/CalendarModal/CalendarModal';
import { secondConverter } from '../../../utils/Tool';
import { PieChart, Pie, Tooltip, ResponsiveContainer, YAxis, XAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { Link, useSearchParams } from 'react-router-dom';
import { IconBook, IconEyeOutline, IconMonitor, IconStatsChart } from '../../../utils/svgs';
import { PieCustomTooltip, pieCustomLabel } from '../../UI/Charts';
import StudyTrendChart from '../../UI/StudyTrendChart';

const serverOrigin = process.env.REACT_APP_ORIGIN;
let rankingTrend = [];

function Stats({ 
  subjects, 
  userInfo,
  tutorialBoxRef,
  tutorialTextRef,
}) {

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

  const [searchParams, setSearchParams] = useSearchParams();
  const statsRef = useRef(null);

  useEffect(() => {
    if (!searchParams) return;

    const tutorial = searchParams.get("tutorial");
    if (tutorial && parseInt(tutorial) === 11) {

      setTimeout(() => {
        const { width, top, left, height, bottom } = statsRef.current.getBoundingClientRect();
        tutorialBoxRef.current.style.left = left + 'px';
        tutorialBoxRef.current.style.top = top  + 'px';
        tutorialBoxRef.current.style.width = width + 'px';
        tutorialBoxRef.current.style.height = height + 'px';
  
        tutorialTextRef.current.style.top = top - 70 + 'px';
        tutorialTextRef.current.style.left = left + 'px';
        tutorialTextRef.current.innerText = "You can analyze your study habits here!";
      }, 500);

      setTimeout(() => {
        setSearchParams(prev => ({ ...prev, tutorial: 12 }));
      }, 4000);
    }
  }, [searchParams]);

  const updateViewer = async (item) => {
    setStatsViewer(item);
  };

  const updateViewDate = (date) => {
    setViewDate(date);
  };

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
    if (!viewDate || !statsViewer || !subjects) return;

    const { daily, weekly, monthly } = subjects;

    if (!daily) return;

    const now = DateTime.now().startOf('day');
    const viewDateTime = DateTime.fromJSDate(viewDate);
    //subject time usage pie chart
    const subjectsPie = updateTimeUsagePie(subjects, viewDateTime, statsViewer);
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
      const subjectsTrend = updateSubjectsTrendChart(subjects, viewDate, statsViewer, 'days');
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
      const subjectsTrend = updateSubjectsTrendChart(subjects, viewDate, statsViewer, 'weeks');
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
      const subjectsTrend = updateSubjectsTrendChart(subjects, viewDate, statsViewer, 'months');
      setTimeout(() => {
        setSubjectsTrend(subjectsTrend);
      }, 310);
    }
  }, [viewDate, statsViewer, subjects]);

  return (
    <div>
      <CalendarModal isCalendarOpen={isCalendarOpen} setIsCalendarOpen={setIsCalendarOpen} updateViewDate={updateViewDate} viewDate={viewDate} subjects={subjects} showHeatmap={true} />
      <div className="Main">
        <div className="title">
          Stats
        </div>
        <div className={styles.Stats} ref={statsRef}>
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
                    to="/dashboard/workout"
                    className={styles.noChart}>
                    <h3>Workout to see stats!</h3>
                  </Link>
                }
              </div>
              <div>
                <div className={styles.overflow}>
                  <i>
                    <IconBook />
                  </i>
                  Total Workout Time {totalStudy}
                </div>
{/*                 <div className={styles.overflow}>
                  <i>
                    <IconMonitor />
                  </i>
                  Website Usage Time {websitesUsage} / {websitesVisit} times
                </div> */}
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
            <h3>Workout Time Trend</h3>
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

export default Stats;