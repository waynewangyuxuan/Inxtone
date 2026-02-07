/**
 * WorldSettings Component
 *
 * Displays and allows inline editing of world configuration (power system and social rules)
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, EmptyState } from '../../components/ui';
import { Input } from '../../components/forms';
import { useWorld, useUpdateWorld } from '../../hooks';
import type { PowerSystem } from '@inxtone/core';
import styles from './shared.module.css';

interface FormData {
  powerSystemName: string;
  levels: string[];
  coreRules: string[];
  constraints: string[];
  socialRules: Record<string, string>;
}

export function WorldSettings(): React.ReactElement {
  const { data: world, isLoading, error } = useWorld();
  const updateMutation = useUpdateWorld();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    powerSystemName: '',
    levels: [],
    coreRules: [],
    constraints: [],
    socialRules: {},
  });

  // Sync form data with world data when entering edit mode
  useEffect(() => {
    if (isEditing && world) {
      setFormData({
        powerSystemName: world.powerSystem?.name ?? '',
        levels: world.powerSystem?.levels ?? [],
        coreRules: world.powerSystem?.coreRules ?? [],
        constraints: world.powerSystem?.constraints ?? [],
        socialRules: world.socialRules ?? {},
      });
    }
  }, [isEditing, world]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    const powerSystem: PowerSystem | undefined = formData.powerSystemName
      ? {
          name: formData.powerSystemName,
          ...(formData.levels.length > 0 && { levels: formData.levels }),
          ...(formData.coreRules.length > 0 && { coreRules: formData.coreRules }),
          ...(formData.constraints.length > 0 && { constraints: formData.constraints }),
        }
      : undefined;

    updateMutation.mutate(
      {
        ...(powerSystem && { powerSystem }),
        ...(Object.keys(formData.socialRules).length > 0 && { socialRules: formData.socialRules }),
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  // Array helpers
  const addArrayItem = (field: 'levels' | 'coreRules' | 'constraints') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayItem = (
    field: 'levels' | 'coreRules' | 'constraints',
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeArrayItem = (field: 'levels' | 'coreRules' | 'constraints', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Social rules helpers
  const addSocialRule = () => {
    const key = `rule_${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      socialRules: { ...prev.socialRules, [key]: '' },
    }));
  };

  const updateSocialRuleKey = (oldKey: string, newKey: string) => {
    setFormData((prev) => {
      const { [oldKey]: value, ...rest } = prev.socialRules;
      return {
        ...prev,
        socialRules: { ...rest, [newKey]: value ?? '' },
      };
    });
  };

  const updateSocialRuleValue = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialRules: { ...prev.socialRules, [key]: value },
    }));
  };

  const removeSocialRule = (key: string) => {
    setFormData((prev) => {
      const { [key]: _, ...rest } = prev.socialRules;
      return {
        ...prev,
        socialRules: rest,
      };
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading world settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load world settings: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  // Check if world has any content
  const hasContent =
    world?.powerSystem ?? (world?.socialRules && Object.keys(world.socialRules).length > 0);

  if (!hasContent && !isEditing) {
    return (
      <EmptyState
        title="No world settings yet"
        description="Define your world's power system and social rules to maintain consistency."
        action={{ label: 'Configure World', onClick: handleEdit }}
      />
    );
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>World Settings</h2>
        {!isEditing ? (
          <Button onClick={handleEdit}>Edit Settings</Button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={handleCancel} variant="ghost" disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <div className={`${styles.grid} ${styles.grid2}`}>
        {/* Power System */}
        <Card>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--color-gold)' }}>Power System</h3>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Name
                </label>
                <Input
                  value={formData.powerSystemName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, powerSystemName: e.target.value }))
                  }
                  placeholder="e.g., Cultivation System, Magic Circles, etc."
                />
              </div>

              {/* Levels */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Levels
                </label>
                {formData.levels.map((level, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Input
                      value={level}
                      onChange={(e) => updateArrayItem('levels', i, e.target.value)}
                      placeholder={`Level ${i + 1}`}
                    />
                    <Button onClick={() => removeArrayItem('levels', i)} variant="ghost">
                      Remove
                    </Button>
                  </div>
                ))}
                <Button onClick={() => addArrayItem('levels')} variant="ghost">
                  + Add Level
                </Button>
              </div>

              {/* Core Rules */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Core Rules
                </label>
                {formData.coreRules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Input
                      value={rule}
                      onChange={(e) => updateArrayItem('coreRules', i, e.target.value)}
                      placeholder={`Rule ${i + 1}`}
                    />
                    <Button onClick={() => removeArrayItem('coreRules', i)} variant="ghost">
                      Remove
                    </Button>
                  </div>
                ))}
                <Button onClick={() => addArrayItem('coreRules')} variant="ghost">
                  + Add Rule
                </Button>
              </div>

              {/* Constraints */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Constraints
                </label>
                {formData.constraints.map((constraint, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Input
                      value={constraint}
                      onChange={(e) => updateArrayItem('constraints', i, e.target.value)}
                      placeholder={`Constraint ${i + 1}`}
                    />
                    <Button onClick={() => removeArrayItem('constraints', i)} variant="ghost">
                      Remove
                    </Button>
                  </div>
                ))}
                <Button onClick={() => addArrayItem('constraints')} variant="ghost">
                  + Add Constraint
                </Button>
              </div>
            </div>
          ) : (
            // Read-only display
            <>
              {world?.powerSystem ? (
                <dl style={{ margin: 0 }}>
                  <dt
                    style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--color-text-muted)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Name
                  </dt>
                  <dd style={{ margin: '0 0 1rem', color: 'var(--color-text)' }}>
                    {world.powerSystem.name}
                  </dd>

                  {world.powerSystem.levels && world.powerSystem.levels.length > 0 && (
                    <>
                      <dt
                        style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--color-text-muted)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Levels
                      </dt>
                      <dd style={{ margin: '0 0 1rem', color: 'var(--color-text)' }}>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                          {world.powerSystem.levels.map((level, i) => (
                            <li key={i}>{level}</li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}

                  {world.powerSystem.coreRules && world.powerSystem.coreRules.length > 0 && (
                    <>
                      <dt
                        style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--color-text-muted)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Core Rules
                      </dt>
                      <dd style={{ margin: '0 0 1rem', color: 'var(--color-text)' }}>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                          {world.powerSystem.coreRules.map((rule, i) => (
                            <li key={i}>{rule}</li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}

                  {world.powerSystem.constraints && world.powerSystem.constraints.length > 0 && (
                    <>
                      <dt
                        style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--color-text-muted)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Constraints
                      </dt>
                      <dd style={{ margin: 0, color: 'var(--color-text)' }}>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                          {world.powerSystem.constraints.map((constraint, i) => (
                            <li key={i}>{constraint}</li>
                          ))}
                        </ul>
                      </dd>
                    </>
                  )}
                </dl>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  No power system defined yet.
                </p>
              )}
            </>
          )}
        </Card>

        {/* Social Rules */}
        <Card>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--color-gold)' }}>Social Rules</h3>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(formData.socialRules).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input
                      value={key}
                      onChange={(e) => updateSocialRuleKey(key, e.target.value)}
                      placeholder="Rule name"
                      style={{ flex: 1 }}
                    />
                    <Button onClick={() => removeSocialRule(key)} variant="ghost">
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={value}
                    onChange={(e) => updateSocialRuleValue(key, e.target.value)}
                    placeholder="Rule description"
                  />
                </div>
              ))}
              <Button onClick={addSocialRule} variant="ghost">
                + Add Social Rule
              </Button>
            </div>
          ) : (
            // Read-only display
            <>
              {world?.socialRules && Object.keys(world.socialRules).length > 0 ? (
                <dl style={{ margin: 0 }}>
                  {Object.entries(world.socialRules).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt
                        style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--color-text-muted)',
                          marginBottom: '0.25rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd style={{ margin: '0 0 1rem', color: 'var(--color-text)' }}>{value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                  No social rules defined yet.
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
