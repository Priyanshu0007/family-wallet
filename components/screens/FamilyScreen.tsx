"use client";
import { useEffect, useState } from 'react';
import { useFamilyStore } from '../../store/familyStore';
import { Plus, Trash2, User } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';

export default function FamilyScreen() {
  const { members, loadMembers, addMember, deleteMember } = useFamilyStore();
  const { cards } = useCardStore();
  const { addToast } = useUiStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relation.trim()) {
      addToast('Name and relation are required', 'error');
      return;
    }
    await addMember({ name, relation, color });
    setName('');
    setRelation('');
    setColor('#3b82f6');
    setIsAdding(false);
    addToast('Family member added', 'success');
  };

  const handleDelete = async (id: string, name: string) => {
    const hasCards = cards.some(c => c.holder === name);
    if (hasCards) {
      addToast(`Cannot remove ${name} because they have registered cards`, 'error');
      return;
    }

    if (confirm(`Remove ${name}?`)) {
      await deleteMember(id);
      addToast('Family member removed', 'success');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 px-4 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-sora font-bold">Family Members</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-surface-elevated p-6 rounded-2xl border border-border mb-8 space-y-4">
          <h3 className="font-sora font-semibold">New Family Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. John Doe"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Relation</label>
              <input
                type="text"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. Spouse, Child"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-[50px] bg-surface border border-border rounded-xl p-1 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Save Member
            </button>
          </div>
        </form>
      )}

      {members.length === 0 && !isAdding ? (
        <div className="text-center py-20 bg-surface-elevated rounded-2xl border border-border border-dashed">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
            <User size={32} />
          </div>
          <h3 className="text-lg font-sora font-medium mb-2">No Family Members Yet</h3>
          <p className="text-text-muted max-w-sm mx-auto">
            Add family members to keep track of whose cards are whose.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member.id} className="bg-surface-elevated p-5 rounded-2xl border border-border flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-sora font-bold text-lg"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-medium text-lg">{member.name}</h4>
                  <p className="text-sm text-text-muted">{member.relation}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(member.id, member.name)}
                className="text-text-muted hover:text-danger p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-danger/10"
                title="Remove"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
