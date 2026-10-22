import { ChevronDown, CloudRain, Info, Utensils } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
import { money } from '../utils/format';
import { Note } from './ui';

const TWEAKS = [
  ['Más barato', 'hazlo más económico'],
  ['Más aventura', 'añade más aventura y actividad física'],
  ['Más tranquilo', 'hazlo más tranquilo y relajado'],
];

const dayTotal = (d) => d.activities.reduce((s, a) => s + (a.costUsd || 0), 0);

// Muestra un itinerario como linea de tiempo: un numero por dia, con el detalle desplegable.
export default function PlanView({ plan, onRegenerate, regenerating }) {
  const [open, setOpen] = useState(0);
  const total = plan.days.reduce((s, d) => s + dayTotal(d), 0);
  const route = plan.route;

  const toggle = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => (o === i ? -1 : i));
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.title}>{plan.title}</Text>
        {route?.places?.length > 0 && (
          <Text style={styles.route}>
            {route.places.join(' → ')}
            {route.approxKm ? ` · ${route.approxKm} km en línea recta` : ''}
          </Text>
        )}
        {plan.overview ? <Text style={styles.text}>{plan.overview}</Text> : null}
        {total > 0 && <Text style={styles.cost}>Costo aproximado de actividades: {money(total)} USD</Text>}
      </View>

      {plan.demo && <Note icon={Info}>Plan de ejemplo del modo demo. Activa la IA para recibir un itinerario adaptado a tus gustos.</Note>}
      {plan.bestTimeNote ? <Text style={styles.best}>{plan.bestTimeNote}</Text> : null}

      <View style={{ gap: 12 }}>
        {plan.days.map((d, i) => {
          const isOpen = open === i;
          const busy = regenerating === d.day;
          return (
            <View key={d.day} style={styles.item}>
              <View style={styles.rail}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{d.day}</Text>
                </View>
                {i < plan.days.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.card}>
                <Pressable onPress={() => toggle(i)} style={styles.head} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.place}>{d.place}</Text>
                    <Text style={styles.theme}>
                      Día {d.day}
                      {d.theme ? ` · ${d.theme}` : ''}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textMuted} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                </Pressable>

                {isOpen && (
                  <View style={styles.body}>
                    {d.activities.map((a) => (
                      <View key={`${a.time}-${a.title}`} style={styles.activity}>
                        {a.time ? <Text style={styles.time}>{a.time}</Text> : null}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.actTitle}>
                            {a.title}
                            {a.costUsd > 0 && <Text style={styles.price}> · ~{money(a.costUsd)}</Text>}
                          </Text>
                          {a.details ? <Text style={styles.details}>{a.details}</Text> : null}
                        </View>
                      </View>
                    ))}
                    {d.foodTip ? (
                      <View style={styles.tip}>
                        <Utensils size={16} color={colors.primary} />
                        <Text style={styles.tipText}>{d.foodTip}</Text>
                      </View>
                    ) : null}
                    {d.rainPlan ? (
                      <View style={styles.tip}>
                        <CloudRain size={16} color={colors.primary} />
                        <Text style={styles.tipText}>
                          <Text style={{ fontFamily: fonts.bold }}>Plan B: </Text>
                          {d.rainPlan}
                        </Text>
                      </View>
                    ) : null}
                    {onRegenerate && (
                      <View style={styles.tweaks}>
                        {busy ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.details}>Reescribiendo el día</Text>
                          </View>
                        ) : (
                          TWEAKS.map(([label, instruction]) => (
                            <Pressable
                              key={label}
                              disabled={Boolean(regenerating)}
                              onPress={() => onRegenerate(d.day, instruction)}
                              style={[styles.tweak, regenerating && { opacity: 0.5 }]}
                            >
                              <Text style={styles.tweakText}>{label}</Text>
                            </Pressable>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {plan.extraIdeas?.length > 0 && <Bullets title="Más ideas" items={plan.extraIdeas} />}
      {plan.packingTips?.length > 0 && <Bullets title="Qué llevar" items={plan.packingTips} />}
    </View>
  );
}

function Bullets({ title, items }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {items.map((x) => (
        <View key={x} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.text}>•</Text>
          <Text style={[styles.text, { flex: 1 }]}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.text },
  route: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  cost: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  best: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted, fontStyle: 'italic' },
  item: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 34 },
  number: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: fonts.bold, color: colors.white, fontSize: 15 },
  line: { flex: 1, width: 2, backgroundColor: colors.cream300, marginTop: 4 },
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, ...shadow, shadowOpacity: 0.06 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  place: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  theme: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  activity: { flexDirection: 'row', gap: 10 },
  time: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary, width: 48 },
  actTitle: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text },
  price: { fontFamily: fonts.medium, color: colors.textMuted },
  details: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.textMuted },
  tip: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: radius.sm, backgroundColor: colors.cream100 },
  tipText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.text },
  tweaks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tweak: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.cream300 },
  tweakText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  block: { gap: 6, padding: 16, borderRadius: radius.md, backgroundColor: colors.white },
  blockTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 4 },
});
