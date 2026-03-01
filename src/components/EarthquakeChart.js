import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

// 固定屏幕尺寸值
const screenWidth = 375;

const EarthquakeChart = ({ earthquakes }) => {
  if (!earthquakes || earthquakes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>没有地震数据</Text>
      </View>
    );
  }

  // 按日期分组地震数据
  const groupByDate = () => {
    const dateGroups = {};
    earthquakes.forEach((earthquake) => {
      const date = new Date(earthquake.properties.time).toLocaleDateString();
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(earthquake);
    });
    return dateGroups;
  };

  // 准备折线图数据（按日期的地震数量）
  const prepareLineChartData = () => {
    const dateGroups = groupByDate();
    const labels = Object.keys(dateGroups);
    const data = Object.values(dateGroups).map(group => group.length);

    return {
      labels: labels.slice(-7), // 只显示最近7天的数据
      datasets: [
        {
          data: data.slice(-7),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  // 准备条形图数据（按震级范围的地震数量）
  const prepareBarChartData = () => {
    const magnitudeRanges = {
      '3.0-3.9': 0,
      '4.0-4.9': 0,
      '5.0-5.9': 0,
      '6.0+': 0,
    };

    earthquakes.forEach((earthquake) => {
      const mag = earthquake.properties.mag;
      if (mag >= 6.0) {
        magnitudeRanges['6.0+']++;
      } else if (mag >= 5.0) {
        magnitudeRanges['5.0-5.9']++;
      } else if (mag >= 4.0) {
        magnitudeRanges['4.0-4.9']++;
      } else if (mag >= 3.0) {
        magnitudeRanges['3.0-3.9']++;
      }
    });

    return {
      labels: Object.keys(magnitudeRanges),
      datasets: [
        {
          data: Object.values(magnitudeRanges),
        },
      ],
    };
  };

  // 准备饼图数据（按震级范围的地震比例）
  const preparePieChartData = () => {
    const magnitudeRanges = {
      '3.0-3.9': 0,
      '4.0-4.9': 0,
      '5.0-5.9': 0,
      '6.0+': 0,
    };

    earthquakes.forEach((earthquake) => {
      const mag = earthquake.properties.mag;
      if (mag >= 6.0) {
        magnitudeRanges['6.0+']++;
      } else if (mag >= 5.0) {
        magnitudeRanges['5.0-5.9']++;
      } else if (mag >= 4.0) {
        magnitudeRanges['4.0-4.9']++;
      } else if (mag >= 3.0) {
        magnitudeRanges['3.0-3.9']++;
      }
    });

    return Object.entries(magnitudeRanges).map(([name, value]) => ({
      name,
      population: value,
      color: getMagnitudeColor(name),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getMagnitudeColor = (range) => {
    switch (range) {
      case '6.0+':
        return '#FF3B30';
      case '5.0-5.9':
        return '#FF9500';
      case '4.0-4.9':
        return '#34C759';
      case '3.0-3.9':
        return '#007AFF';
      default:
        return '#999';
    }
  };

  const lineChartData = prepareLineChartData();
  const barChartData = prepareBarChartData();
  const pieChartData = preparePieChartData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>地震数据可视化</Text>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>每日地震数量</Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#007AFF',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>地震震级分布</Text>
        <BarChart
          data={barChartData}
          width={screenWidth - 32}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            barPercentage: 0.7,
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>地震震级比例</Text>
        <PieChart
          data={pieChartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    color: '#000',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 40,
  },
});

export default EarthquakeChart;