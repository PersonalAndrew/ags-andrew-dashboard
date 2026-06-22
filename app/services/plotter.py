import matplotlib

matplotlib.use('Agg')
import base64
import io

import matplotlib.pyplot as plt
from mplsoccer import Pitch


def get_base64_image(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', transparent=True)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

def plot_heatmap(heatmap_data):
    if not heatmap_data:
        return None

    pitch = Pitch(pitch_type='opta', pitch_color='#1a1f24', line_color='#ffffff')
    fig, ax = pitch.draw(figsize=(10, 7))

    x = [pt['x'] for pt in heatmap_data]
    y = [pt['y'] for pt in heatmap_data]

    pitch.kdeplot(x, y, ax=ax, cmap='magma', fill=True, levels=100, zorder=1, alpha=0.7)

    return get_base64_image(fig)

def plot_shotmap(shotmap_data):
    if not shotmap_data:
        return None

    pitch = Pitch(pitch_type='opta', pitch_color='#1a1f24', line_color='#ffffff')
    fig, ax = pitch.draw(figsize=(10, 7))

    for shot in shotmap_data:
        coords = shot.get('playerCoordinates', {})
        if not coords:
            continue

        x = coords.get('x', 0)
        y = coords.get('y', 0)
        shot_type = shot.get('shotType', '')

        if shot_type == 'goal':
            color = '#10b981'
            marker = '*'
            size = 400
        elif shot_type in ('save', 'block'):
            color = '#f59e0b'
            marker = 's'
            size = 200
        else:
            color = '#ef4444'
            marker = 'o'
            size = 200

        pitch.scatter(x, y, ax=ax, c=color, s=size, edgecolors='black', marker=marker, zorder=2, alpha=0.9)

    return get_base64_image(fig)

def plot_passmap(passes):
    if not passes:
        return None

    pitch = Pitch(pitch_type='opta', pitch_color='#1a1f24', line_color='#ffffff')
    fig, ax = pitch.draw(figsize=(10, 7))

    for p in passes:
        coords = p.get('playerCoordinates', {})
        end_coords = p.get('passEndCoordinates', {})
        if not coords or not end_coords:
            continue

        x = coords.get('x', 0)
        y = coords.get('y', 0)
        end_x = end_coords.get('x', 0)
        end_y = end_coords.get('y', 0)
        color = '#1A78CF' if p.get('outcome') else '#F64B4B'

        pitch.arrows(x, y, end_x, end_y,
                     width=2, headwidth=5, headlength=5,
                     color=color, ax=ax)

    return get_base64_image(fig)

def plot_action_map(events, title):
    if not events:
        return None

    pitch = Pitch(pitch_type='opta', pitch_color='#1a1f24', line_color='#ffffff')
    fig, ax = pitch.draw(figsize=(10, 7))

    for e in events:
        coords = e.get('playerCoordinates', {})
        if not coords:
            continue
        x = coords.get('x', 0)
        y = coords.get('y', 0)
        pitch.scatter(x, y, s=150, color='#9B59B6', edgecolors='white', ax=ax)

    return get_base64_image(fig)
