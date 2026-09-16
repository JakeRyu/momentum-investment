import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { APP_STORE_URL } from '../appStore';

/**
 * Shown when the server says this build is old enough that it no longer
 * stands behind what is on screen.
 *
 * It appears on Home as well as the detail screen because Home is not a
 * menu: it prints each strategy's allocation and carries the "Mark as
 * rebalanced" button, so a holder can read an answer and act on it without
 * ever opening a strategy. A warning that only lived one tap deeper would
 * miss the path most people take.
 *
 * It cannot be dismissed. This app is opened about once a month, so a
 * dismissal would be permanent in practice, and the message is that the
 * numbers beside it may be wrong.
 */
export default function UpdateBanner() {
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => Linking.openURL(APP_STORE_URL)}
      accessibilityRole="link"
      accessibilityLabel="Update this app on the App Store"
    >
      <Text style={styles.title}>This version is out of date</Text>
      <Text style={styles.body}>
        It may show allocations that no longer match the rule. Tap to update.
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Orange, the hue the Defensive badge already uses: attention without
  // alarm. Red is not in this app's vocabulary and would overstate a
  // message that is advisory — nothing here is blocked.
  banner: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffb37e',
    backgroundColor: '#16191e',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  title: {
    color: '#ffb37e',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: '#8a93a0',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
