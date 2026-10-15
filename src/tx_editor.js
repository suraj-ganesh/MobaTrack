// Transaction editor: manual entry + itemized receipt splits + auto-categorization.
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { C, CATS, CURRENCIES, font, isISODate, todayISO, uid } from './theme';
import { suggestCategory } from './categorize';
import { Btn, Chip, Field, Sheet, confirmAct, notify } from './ui';

const numOnly = (v) => String(v ?? '').replace(/[^0-9.]/g, '');

function ItemRows({ items, onChange }) {
  const set = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const add = () => onChange([...items, { label: '', amount: '', category: 'Groceries' }]);
  const del = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <View>
      {items.map((it, i) => (
        <View key={i} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 8, marginVertical: 4 }}>
          <TextInput
            style={{ borderBottomWidth: 1, borderColor: C.line, paddingVertical: 6, fontSize: 14, color: C.ink }}
            placeholder="Item description"
            placeholderTextColor={C.faint}
            value={it.label}
            onChangeText={(v) => set(i, { label: v.slice(0, 60) })}
          />
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: C.ink }}
              placeholder="0.00"
              placeholderTextColor={C.faint}
              keyboardType="numeric"
              value={String(it.amount ?? '')}
              onChangeText={(v) => set(i, { amount: numOnly(v) })}
            />
            <Pressable onPress={() => del(i)} style={{ justifyContent: 'center', paddingHorizontal: 12 }}>
              <Text style={{ color: C.danger, fontWeight: '700' }}>Remove</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
            {CATS.expense.map((c) => (
              <Chip key={c} label={c} active={it.category === c} onPress={() => set(i, { category: c })} />
            ))}
          </View>
        </View>
      ))}
      <Btn title="+ Add receipt line" kind="ghost" onPress={add} />
    </View>
  );
}

export function TxEditor({ visible, initial, base, defaultCurrency, learned, onClose, onSave, onDelete, onLearn }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food & Drink');
  const [manualCat, setManualCat] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showItems, setShowItems] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (visible) {
      const t = initial || {};
      setAmount(t.amount != null ? String(t.amount) : '');
      setCurrency(t.currency || defaultCurrency);
      const ty = t.type === 'income' ? 'income' : 'expense';
      setType(ty);
      setCategory(t.category || (ty === 'income' ? 'Salary' : 'Food & Drink'));
      setManualCat(!!t.id);
      setMerchant(t.merchant || '');
      setNote(t.note || '');
      setDate(t.date && isISODate(t.date) ? t.date : todayISO());
      setItems(Array.isArray(t.items) ? t.items.map((i) => ({ ...i, amount: String(i.amount) })) : []);
      setShowItems(Array.isArray(t.items) && t.items.length > 0);
    }
  }, [visible, initial, defaultCurrency]);

  // Smart suggest: auto-pick a category from merchant/note until user overrides.
  useEffect(() => {
    if (!visible || manualCat) return;
    const s = suggestCategory(`${merchant} ${note}`, type, learned);
    if (s) setCategory(s);
  }, [merchant, note, type, learned]);

  const cats = type === 'income' ? CATS.income : CATS.expense;
  const itemSum = useMemo(
    () => items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [items]
  );
  const total = Number(amount) || 0;
  const editing = !!(initial && initial.id);

  const save = () => {
    if (!(total > 0)) return notify('Enter an amount greater than 0.');
    if (!isISODate(date)) return notify('Date must be YYYY-MM-DD.');
    const cleanItems = showItems
      ? items.filter((i) => Number(i.amount) > 0).map((i) => ({
          label: String(i.label || '').slice(0, 60),
          amount: Number(i.amount),
          category: CATS.expense.includes(i.category) ? i.category : 'Groceries',
        }))
      : [];
    if (cleanItems.length && itemSum - total > 0.004) {
      return notify('Receipt lines exceed the total. Adjust amounts.');
    }
    const wasManual = manualCat;
    const tx = {
      id: (initial && initial.id) || uid(),
      amount: total,
      currency: CURRENCIES.includes(currency) ? currency : defaultCurrency,
      type,
      category: cats.includes(category) ? category : type === 'income' ? 'Other' : 'Other',
      merchant: merchant.trim().slice(0, 80),
      note: note.trim().slice(0, 140),
      date,
      items: type === 'expense' ? cleanItems : [],
    };
    // Only memorize explicit user corrections — never defaults or suggestions.
    if (onLearn && wasManual && merchant.trim()) {
      onLearn(merchant, note, tx.category);
    }
    onSave(tx);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {['expense', 'income'].map((t) => (
          <Chip
            key={t}
            label={t === 'expense' ? 'Expense' : 'Income'}
            active={type === t}
            onPress={() => {
              setType(t);
              setManualCat(false);
              setCategory(t === 'income' ? 'Salary' : 'Food & Drink');
            }}
          />
        ))}
      </View>
      <Field label={`Amount (${currency})`} placeholder="0.00" keyboardType="numeric"
        value={amount} onChangeText={(v) => setAmount(numOnly(v))} returnKeyType="done" />
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 6, marginBottom: 2, fontFamily: font.medium }}>Currency</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CURRENCIES.map((c) => (
          <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />
        ))}
      </View>
      <Field label="Merchant / source" placeholder="e.g. Whole Foods, Employer"
        value={merchant} onChangeText={setMerchant} maxLength={80} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 6, marginBottom: 2, fontFamily: font.medium }}>
        Category{!manualCat ? ' (auto-suggested)' : ''}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cats.map((c) => (
          <Chip key={c} label={c} active={category === c}
            onPress={() => { setCategory(c); setManualCat(true); }} />
        ))}
      </View>
      <Field label="Note (optional)" placeholder="Anything to remember" value={note}
        onChangeText={(v) => setNote(v.slice(0, 140))} />
      <Field label="Date (YYYY-MM-DD)" value={date} maxLength={10}
        onChangeText={(v) => setDate(v.replace(/[^0-9\-]/g, '').slice(0, 10))} />
      {type === 'expense' && (
        <View style={{ marginTop: 8 }}>
          <Pressable onPress={() => setShowItems((s) => !s)}>
            <Text style={{ color: C.accent, fontWeight: '800', fontSize: 14 }}>
              {showItems ? '− Hide receipt lines' : '+ Split receipt into lines'}
            </Text>
          </Pressable>
          {showItems && (
            <View style={{ marginTop: 6 }}>
              <ItemRows items={items} onChange={setItems} />
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: font.regular }}>
                Lines total {itemSum.toFixed(2)} / {total.toFixed(2)}
                {itemSum <= total ? ' — remainder stays under the main category.' : ' — OVER total.'}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={{ height: 10 }} />
      <Btn title={editing ? 'Save changes' : 'Add transaction'} onPress={save} />
      {editing && onDelete && (
        <Btn title="Delete" kind="danger" onPress={() => confirmAct('Delete?', 'Remove this transaction?', 'Delete', () => { onDelete(initial.id); onClose(); })} />
      )}
    </Sheet>
  );
}